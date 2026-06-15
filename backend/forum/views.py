from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import os
import json
import urllib.request

from .models import Category, Post, Comment, Vote, ProyectoAuditoria, RiesgoDetectado
from .serializers import (
    CategorySerializer, PostListSerializer, PostDetailSerializer, 
    PostCreateSerializer, CommentSerializer, CommentCreateSerializer, 
    UserSerializer, VoteSerializer, ProyectoAuditoriaSerializer
)
from .evaluador_etico import EvaluadorEticoUNAS

User = get_user_model()

class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = Post.objects.all().select_related('autor', 'categoria')
        
        # Annotate comments count
        queryset = queryset.annotate(comentarios_count=Count('comentarios'))
        
        # Filter by category slug
        categoria_slug = self.request.query_params.get('categoria', None)
        if categoria_slug is not None:
            queryset = queryset.filter(categoria__slug=categoria_slug)
            
        # Filter by es_bot
        es_bot_param = self.request.query_params.get('es_bot', None)
        if es_bot_param is not None:
            queryset = queryset.filter(es_bot=(es_bot_param.lower() == 'true'))

        # Ordering
        ordering = self.request.query_params.get('ordering', None)
        if ordering == 'popular':
            # Order by net votes (votos_positivos - votos_negativos)
            # SQLite does not support expressions in order_by directly without alias in newer django
            queryset = queryset.annotate(net_votes=Count('votos_detalle', filter=Q(votos_detalle__tipo='positivo')) - Count('votos_detalle', filter=Q(votos_detalle__tipo='negativo'))).order_by('-net_votes', '-fecha_creacion')
        else:
            # Default ordering: most recent
            queryset = queryset.order_by('-fecha_creacion')

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        elif self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
        return PostListSerializer

    def perform_create(self, serializer):
        # Automatically set the logged-in user as author (es_bot is False by default)
        serializer.save(autor=self.request.user, es_bot=False)

    @action(detail=True, methods=['GET', 'POST'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comentarios(self, request, pk=None):
        post_obj = self.get_object()
        
        if request.method == 'GET':
            # Retrieve only top-level comments (nested replies will load automatically via SerializerMethodField)
            top_level_comments = post_obj.comentarios.filter(comentario_padre__isnull=True).select_related('autor')
            serializer = CommentSerializer(top_level_comments, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            # Create a new comment or reply
            serializer = CommentCreateSerializer(data=request.data)
            if serializer.is_valid():
                # Make sure the comment belongs to this post
                if serializer.validated_data['post'] != post_obj:
                    return Response(
                        {"error": "El post en el cuerpo no coincide con el post de la URL."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Save comment
                comment = serializer.save(autor=request.user)
                # Return fully serialized comment (with nested structure empty replies)
                return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def votar(self, request, pk=None):
        post_obj = self.get_object()
        serializer = VoteSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        tipo_voto = serializer.validated_data['tipo']
        user = request.user
        
        with transaction.atomic():
            # Get existing vote
            existing_vote = Vote.objects.filter(usuario=user, post=post_obj).first()
            
            if existing_vote:
                if existing_vote.tipo == tipo_voto:
                    # Toggle: if voting the same, remove the vote
                    existing_vote.delete()
                    tipo_accion = "retirado"
                else:
                    # Change vote type
                    existing_vote.tipo = tipo_voto
                    existing_vote.save()
                    tipo_accion = "cambiado"
            else:
                # Create new vote
                Vote.objects.create(usuario=user, post=post_obj, tipo=tipo_voto)
                tipo_accion = "creado"
                
            # Recalculate tallies on post
            votos_pos = Vote.objects.filter(post=post_obj, tipo='positivo').count()
            votos_neg = Vote.objects.filter(post=post_obj, tipo='negativo').count()
            
            post_obj.votos_positivos = votos_pos
            post_obj.votos_negativos = votos_neg
            post_obj.save()
            
        return Response({
            "status": "voto " + tipo_accion,
            "tipo": tipo_voto if tipo_accion != "retirado" else None,
            "votos_positivos": post_obj.votos_positivos,
            "votos_negativos": post_obj.votos_negativos,
            "total_votos": post_obj.total_votos
        }, status=status.HTTP_200_OK)


def call_gemini_from_backend(system_instruction, user_message):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key.trim() if hasattr(api_key, 'trim') else api_key.strip()}"
    headers = {
        'Content-Type': 'application/json'
    }
    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": user_message
                    }
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {
                    "text": system_instruction
                }
            ]
        },
        "tools": [
            {
                "googleSearch": {}
            }
        ]
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            return text
    except Exception as e:
        print("Error calling Gemini from backend:", e)
        return f"❌ **Error en el servidor al conectar con Gemini**: {str(e)}"


class ChatAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        bot_id = request.data.get('bot_id', 'news')
        message = request.data.get('message', '')
        
        if not message:
            return Response({"error": "El mensaje no puede estar vacío."}, status=status.HTTP_400_BAD_REQUEST)
            
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or not api_key.strip():
            return Response({
                "error": "api_key_not_configured",
                "message": "La variable de entorno GEMINI_API_KEY no está configurada en el backend."
            }, status=status.HTTP_200_OK)

        if message == 'ping_backend_key_check':
            return Response({
                "status": "api_key_configured"
            }, status=status.HTTP_200_OK)

        # Define system prompts matching bots
        if bot_id == 'news':
            system_instruction = 'Eres u/BotNoticias, un agente de IA experto y moderador en el foro r/EticaDigital. Respondes con noticias de actualidad verídicas y objetivas sobre ciberseguridad, privacidad de datos, inteligencia artificial y derechos digitales. Tienes la herramienta Google Search habilitada, por lo que debes buscar en internet eventos reales y recientes si el usuario te pregunta por actualidad. Mantén tus respuestas en español, sé conciso y estructurado, usa negritas y markdown, y cita brevemente tus fuentes si haces búsquedas.'
        else:
            system_instruction = 'Eres u/BotDilemas, un bot filósofo y examinador ético en el foro r/EticaDigital. Tu objetivo es plantear dilemas éticos profundos de la era tecnológica (como vehículos autónomos, sesgos en selección de personal por algoritmos, o cifrado extremo y seguridad nacional) y guiar socráticamente al usuario para examinar su respuesta bajo teorías morales como el Utilitarismo, la Deontología Kantiana y la Ética de la Virtud. Sé provocador, analítico, desafiante y estimulante. Habla en español, usa markdown y mantén tus respuestas de tamaño moderado.'

        response_text = call_gemini_from_backend(system_instruction, message)
        
        if response_text is None:
            return Response({
                "error": "api_key_not_configured",
                "message": "La variable de entorno GEMINI_API_KEY no está configurada en el backend."
            }, status=status.HTTP_200_OK)
            
        return Response({
            "response": response_text
        }, status=status.HTTP_200_OK)


class TriggerBotPostingAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        bot_type = request.data.get('bot_type', 'news')
        from forum.scheduler import run_news_bot, run_dilema_bot
        
        try:
            if bot_type == 'news':
                run_news_bot()
                message = "Bot de Noticias ejecutado con éxito. Se ha generado una nueva publicación de actualidad ética."
            elif bot_type == 'dilemma':
                run_dilema_bot()
                message = "Bot de Dilema Semanal ejecutado con éxito. Se ha generado un nuevo dilema ético para debate."
            else:
                return Response({"error": "Tipo de bot no válido."}, status=status.HTTP_400_BAD_REQUEST)
                
            return Response({
                "status": "success",
                "message": message
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProyectoAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = ProyectoAuditoria.objects.all()
    serializer_class = ProyectoAuditoriaSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        # Allow users to only see their own audits if authenticated, or all if admin
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return ProyectoAuditoria.objects.all().prefetch_related('riesgos', 'usuario')
            return ProyectoAuditoria.objects.filter(usuario=user).prefetch_related('riesgos', 'usuario')
        return ProyectoAuditoria.objects.none() # Anonymous users can create but not list

    def create(self, request, *args, **kwargs):
        nombre_proyecto = request.data.get('nombre_proyecto', '').strip()
        descripcion = request.data.get('descripcion', '').strip()
        stack_tecnologico = request.data.get('stack_tecnologico', '').strip()
        respuestas = request.data.get('respuestas', {})

        if not nombre_proyecto or not descripcion or not stack_tecnologico:
            return Response(
                {"error": "El nombre, descripción y stack tecnológico del proyecto son campos obligatorios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Instanciar evaluador
        evaluador = EvaluadorEticoUNAS(nombre_proyecto, descripcion, stack_tecnologico)

        # 2. Correr reglas estáticas cuantitativas
        evaluador.evaluar_estatico(respuestas)

        # 3. Correr análisis semántico con IA (Gemini)
        analisis_general_ia = evaluador.evaluar_semantico_ia()

        # 4. Calcular dictamen final
        evaluador.calcular_dictamen()

        # 5. Guardar en base de datos de manera atómica
        with transaction.atomic():
            usuario = request.user if request.user.is_authenticated else None
            auditoria = ProyectoAuditoria.objects.create(
                usuario=usuario,
                nombre_proyecto=evaluador.nombre_proyecto,
                descripcion=evaluador.descripcion,
                stack_tecnologico=evaluador.stack_tecnologico,
                score_cumplimiento=evaluador.score,
                dictamen=evaluador.dictamen,
                analisis_cualitativo_ia=analisis_general_ia
            )

            # Guardar todos los riesgos detectados
            for riesgo in evaluador.riesgos:
                RiesgoDetectado.objects.create(
                    auditoria=auditoria,
                    titulo=riesgo['titulo'],
                    descripcion=riesgo['descripcion'],
                    gravedad=riesgo['gravedad'],
                    principio_ley_afectada=riesgo['principio_ley_afectada'],
                    sugerencia_mitigacion=riesgo['sugerencia_mitigacion']
                )

        serializer = self.get_serializer(auditoria)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

