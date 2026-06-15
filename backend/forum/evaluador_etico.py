import os
import json
import urllib.request
from django.conf import settings

class EvaluadorEticoUNAS:
    def __init__(self, nombre_proyecto, descripcion, stack_tecnologico):
        self.nombre_proyecto = nombre_proyecto
        self.descripcion = descripcion
        self.stack_tecnologico = stack_tecnologico
        self.score = 100
        self.riesgos = [] # Lista de diccionarios: {titulo, descripcion, gravedad, principio_ley_afectada, sugerencia_mitigacion}
        self.dictamen = 'viable'

    def evaluar_estatico(self, respuestas):
        """
        Ejecuta las reglas de decisión cuantitativas a partir de las respuestas del cuestionario.
        respuestas es un diccionario con booleanos:
        - maneja_datos_personales
        - cifra_datos
        - usa_codigo_plagiado
        - respeta_licencias
        - tiene_vulnerabilidades
        - realiza_auditorias
        - toma_decisiones_automatizadas
        - mitiga_sesgos
        - informa_metricas_reales
        - evita_patrones_oscuros
        - optimiza_recursos
        """
        # 1. Privacidad y Datos Personales (Respeto & Legalidad Ley 29733)
        if respuestas.get('maneja_datos_personales'):
            if not respuestas.get('cifra_datos'):
                self.score -= 20
                self.riesgos.append({
                    'titulo': 'Exposición de Datos Personales sin Cifrado',
                    'descripcion': 'El proyecto gestiona información sensible de usuarios finales sin aplicar mecanismos de cifrado ni protección en tránsito/reposo.',
                    'gravedad': 'critica',
                    'principio_ley_afectada': 'Principio de Respeto (UNAS) y Ley N.º 29733 (Protección de Datos Personales en Perú)',
                    'sugerencia_mitigacion': 'Implementar cifrado AES-256 para almacenamiento y TLS 1.3 para comunicaciones. Establecer políticas estrictas de consentimiento del titular de los datos.'
                })

        # 2. Propiedad Intelectual y Licencias (Probidad & Legalidad)
        if respuestas.get('usa_codigo_plagiado'):
            self.score -= 30
            self.riesgos.append({
                'titulo': 'Uso ilícito o Plagio de Código Fuente',
                'descripcion': 'El proyecto incluye fragmentos o módulos enteros de código fuente ajeno sin atribución ni autorización, vulnerando derechos de autor.',
                'gravedad': 'critica',
                'principio_ley_afectada': 'Principio de Probidad (UNAS) y Legislación sobre Derechos de Autor (Indecopi)',
                'sugerencia_mitigacion': 'Eliminar o refactorizar el código plagiado de inmediato. Implementar un proceso riguroso de atribución y auditoría de software propio.'
            })
        
        if not respuestas.get('respeta_licencias'):
            self.score -= 15
            self.riesgos.append({
                'titulo': 'Infracción de Licencias de Terceros (FOSS/Comerciales)',
                'descripcion': 'Se incumple con los términos de licenciamiento abierto (ej. GPL, Apache) o comerciales del software integrado.',
                'gravedad': 'media',
                'principio_ley_afectada': 'Principio de Legalidad (UNAS)',
                'sugerencia_mitigacion': 'Auditar las licencias de todas las dependencias del proyecto utilizando herramientas como FOSSA. Alinear el tipo de distribución del software a las licencias compatibles.'
            })

        # 3. Seguridad de los Sistemas (Idoneidad & Delitos Informáticos Ley 30096)
        if respuestas.get('tiene_vulnerabilidades'):
            self.score -= 20
            self.riesgos.append({
                'titulo': 'Presencia de Vulnerabilidades Críticas Expuestas',
                'descripcion': 'El sistema contiene fallas de seguridad conocidas sin parches (ej: inyecciones SQL, XSS, dependencias desactualizadas).',
                'gravedad': 'critica',
                'principio_ley_afectada': 'Principio de Idoneidad (UNAS) y Ley N.º 30096 (Ley de Delitos Informáticos en Perú)',
                'sugerencia_mitigacion': 'Ejecutar análisis estático (SAST/DAST) y actualizar todas las dependencias críticas. Corregir sanitizaciones de inputs en base de datos.'
            })
        
        if not respuestas.get('realiza_auditorias'):
            self.score -= 10
            self.riesgos.append({
                'titulo': 'Ausencia de Auditorías Periódicas de Código',
                'descripcion': 'No se contemplan revisiones de calidad ni auditorías de seguridad sistemáticas, aumentando la probabilidad de fallos silenciosos.',
                'gravedad': 'leve',
                'principio_ley_afectada': 'Principio de Eficiencia (UNAS)',
                'sugerencia_mitigacion': 'Programar auditorías de código cada trimestre y automatizar análisis de dependencias vulnerables en la canalización CI/CD.'
            })

        # 4. Justicia Algorítmica (Justicia)
        if respuestas.get('toma_decisiones_automatizadas') and not respuestas.get('mitiga_sesgos'):
            self.score -= 15
            self.riesgos.append({
                'titulo': 'Sesgos Algorítmicos en Decisiones Automatizadas',
                'descripcion': 'El sistema realiza valoraciones o clasificaciones automatizadas (ej: selección de personal, créditos) sin auditar sesgos de género, etnia o nivel socioeconómico.',
                'gravedad': 'media',
                'principio_ley_afectada': 'Principio de Justicia (UNAS)',
                'sugerencia_mitigacion': 'Incorporar metodologías de transparencia y explicabilidad algorítmica. Auditar los conjuntos de datos de entrenamiento para garantizar equidad estadística.'
            })

        # 5. Veracidad y Transparencia (Veracidad & Lealtad)
        if not respuestas.get('informa_metricas_reales'):
            self.score -= 10
            self.riesgos.append({
                'titulo': 'Opacidad o Manipulación de Métricas de Rendimiento',
                'descripcion': 'El sistema oculta telemetrías reales, fallos de infraestructura o exagera capacidades técnicas frente a los clientes o supervisores.',
                'gravedad': 'media',
                'principio_ley_afectada': 'Principio de Veracidad (UNAS)',
                'sugerencia_mitigacion': 'Establecer páneles de estado (status pages) públicos o auditables e informar de manera honesta sobre los SLAs del servicio.'
            })
            
        if not respuestas.get('evita_patrones_oscuros'):
            self.score -= 15
            self.riesgos.append({
                'titulo': 'Implementación de Patrones Oscuros (Dark Patterns)',
                'descripcion': 'La interfaz de usuario incluye diseños engañosos para forzar compras, suscripciones o consentimientos de privacidad no deseados.',
                'gravedad': 'media',
                'principio_ley_afectada': 'Principio de Lealtad (UNAS)',
                'sugerencia_mitigacion': 'Rediseñar los flujos de UX/UI priorizando el diseño honesto, con opciones claras de exclusión voluntaria (opt-out) y términos legibles.'
            })

        # 6. Optimización de Recursos (Eficiencia)
        if not respuestas.get('optimiza_recursos'):
            self.score -= 5
            self.riesgos.append({
                'titulo': 'Ineficiencia en el Consumo Energético o de Carga',
                'descripcion': 'El software realiza procesamiento redundante en segundo plano o sobrecarga el hardware cliente innecesariamente.',
                'gravedad': 'leve',
                'principio_ley_afectada': 'Principio de Eficiencia (UNAS)',
                'sugerencia_mitigacion': 'Optimizar consultas a base de datos, implementar almacenamiento en caché eficiente y limitar procesos inactivos en el cliente.'
            })

        # Ajuste de límites del Score
        self.score = max(0, min(100, self.score))

    def evaluar_semantico_ia(self):
        """
        Llama a la API de Gemini para analizar semánticamente la descripción del proyecto,
        identificando riesgos de ética profesional o legales que escapan al análisis estático.
        """
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return "No se ha configurado la variable de entorno GEMINI_API_KEY para análisis cualitativo por IA."

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key.strip()}"
        headers = {
            'Content-Type': 'application/json'
        }

        # Prompt estructurado para Gemini
        prompt = f"""
        Analiza de forma semántica y cualitativa la viabilidad ética del siguiente proyecto de software:
        Nombre del Proyecto: {self.nombre_proyecto}
        Stack Tecnológico: {self.stack_tecnologico}
        Descripción detallada:
        "{self.descripcion}"

        Identifica riesgos éticos sutiles específicos para este tipo de aplicación (como dilemas de sesgo algorítmico, dependencias de nube de alto costo que afecten la eficiencia, dependencia tecnológica, seguridad frente al hackeo, riesgos de privacidad por fuga de datos, etc.).
        Toma en cuenta los 8 Principios Éticos de la Universidad Nacional Agraria de la Selva (UNAS) en Perú: Respeto, Probidad, Eficiencia, Idoneidad, Veracidad, Lealtad, Justicia y Legalidad.

        Responde ÚNICAMENTE en formato JSON estructurado con la siguiente firma exacta:
        {{
            "analisis_general": "Resumen ejecutivo del análisis ético cualitativo",
            "riesgos_adicionales": [
                {{
                    "titulo": "Título breve del riesgo específico encontrado",
                    "descripcion": "Explicación detallada del riesgo ético semántico y su posible impacto",
                    "gravedad": "critica" o "media" o "leve",
                    "principio_ley_afectada": "Principio UNAS o Ley Peruana afectada",
                    "sugerencia_mitigacion": "Sugerencia técnica de mitigación del riesgo"
                }}
            ]
        }}
        No incluyas texto explicativo fuera del bloque JSON ni bloques de formato markdown. Solo retorna el JSON puro.
        """

        body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                
                # Parse JSON response from Gemini
                parsed_json = json.loads(text_response)
                
                # Agregar los riesgos cualitativos encontrados por Gemini
                for riesgo in parsed_json.get('riesgos_adicionales', []):
                    # Reducir score por riesgos adicionales de IA
                    impacto = 15 if riesgo.get('gravedad') == 'critica' else (10 if riesgo.get('gravedad') == 'media' else 5)
                    self.score = max(0, self.score - impacto)
                    
                    self.riesgos.append({
                        'titulo': f"[IA] {riesgo.get('titulo')}",
                        'descripcion': riesgo.get('descripcion'),
                        'gravedad': riesgo.get('gravedad'),
                        'principio_ley_afectada': riesgo.get('principio_ley_afectada'),
                        'sugerencia_mitigacion': riesgo.get('sugerencia_mitigacion')
                    })
                
                return parsed_json.get('analisis_general', 'Análisis cualitativo completado.')
        except Exception as e:
            print("Error al invocar análisis semántico con Gemini:", e)
            return f"El análisis cuantitativo finalizó con éxito, pero el motor semántico de IA reportó un error técnico temporal: {str(e)}"

    def calcular_dictamen(self):
        """Determina el dictamen de viabilidad final a partir del puntaje acumulado"""
        if self.score >= 80:
            self.dictamen = 'viable'
        elif self.score >= 50:
            self.dictamen = 'con_riesgos'
        else:
            self.dictamen = 'no_viable'
