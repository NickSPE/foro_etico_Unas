import os
import requests
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from django.utils.text import slugify
from django.db import transaction

# Setup logger
logger = logging.getLogger(__name__)

# List of predefined ethical dilemmas
DILEMAS_PREDEFINIDOS = [
    {
        "titulo": "¿Algoritmos imparciales? El sesgo en el reclutamiento de personal",
        "contenido": "Una empresa multinacional decide delegar su primer filtro de contratación de ingenieros a una Inteligencia Artificial. Al cabo de unos meses, se descubre que el sistema ha descartado sistemáticamente candidatas mujeres para puestos técnicos porque se entrenó con currículums históricos de los últimos 20 años, donde el 90% de los contratados eran hombres. El sistema asumió que ser hombre era un factor de éxito.\n\n**Pregunta para debate:** Como líder del equipo de TI, tu dirección te pide mantener el sistema activo argumentando que ahorra millones de dólares y que 'se auto-corregirá con el tiempo'. ¿Qué harías? ¿Apagarías el sistema inmediatamente arriesgando tu puesto, o aceptarías el sesgo en favor del negocio?",
        "categoria_name": "Inteligencia Artificial"
    },
    {
        "titulo": "Monitoreo silencioso de productividad: ¿Seguridad laboral o invasión?",
        "contenido": "La junta directiva de tu empresa te pide instalar de forma remota y silenciosa un agente de software en las laptops de todos los empleados corporativos. El software registra las pulsaciones de teclado (keylogger), captura pantallas de forma aleatoria cada 5 minutos y utiliza la cámara web para analizar la fatiga mediante algoritmos de IA. Te ordenan explícitamente no informar a la plantilla para 'no alterar su comportamiento natural'.\n\n**Pregunta para debate:** Sabiendo que esto vulnera gravemente las expectativas de privacidad y la confianza de tus compañeros, pero que es técnicamente legal bajo el contrato laboral firmado. ¿Instalarías el software silenciosamente o denunciarías la práctica públicamente?",
        "categoria_name": "Privacidad"
    },
    {
        "titulo": "El dilema del ransomware en un hospital infantil",
        "contenido": "Un hospital pediátrico sufre un ciberataque de ransomware que cifra todos los historiales médicos electrónicos y sistemas de monitoreo en tiempo real. Los ciberdelincuentes exigen un rescate en criptomonedas equivalente a $150,000 USD para entregar la clave de descifrado, y amenazan con borrarlo todo en 12 horas. El director de TI sabe que pagar fomenta el crimen internacional y no garantiza recuperar los datos, pero los médicos alertan que hay vidas de niños críticamente enfermos que dependen de esa información en las próximas horas.\n\n**Pregunta para debate:** Si fueras el asesor de seguridad del hospital, ¿recomendarías pagar el rescate inmediatamente o rechazarías el pago priorizando la política de seguridad a largo plazo?",
        "categoria_name": "Ciberseguridad"
    },
    {
        "titulo": "La censura algorítmica y la libertad de expresión en elecciones",
        "contenido": "Durante el periodo de elecciones generales, se difunde un video manipulado ('deepfake') muy convincente donde se acusa a un candidato líder de recibir financiamiento de organizaciones criminales. El video se está compartiendo miles de veces por minuto. El equipo técnico propone aplicar un filtro de bloqueo algorítmico inmediato de palabras clave y cuentas relacionadas, pero esto bloquearía discusiones legítimas de periodistas y limitaría la libertad de expresión en un momento político crítico.\n\n**Pregunta para debate:** ¿Debería la red social priorizar el orden público bloqueando preventivamente el video y afectando discusiones legítimas, o defender el principio de libre expresión digital sin filtros previos?",
        "categoria_name": "Derechos Digitales"
    },
    {
        "titulo": "El Scraping masivo y el derecho de autor de los creadores",
        "contenido": "Una startup tecnológica realiza scraping masivo de millones de imágenes de portafolios digitales de artistas independientes (obtenidas de internet públicamente, pero protegidas por derechos de autor) para entrenar una IA generativa comercial. Los artistas protestan porque la IA competirá con ellos imitando sus estilos únicos sin su consentimiento ni compensación económica alguna. La startup alega que la IA aprende de forma idéntica a cómo se inspira un humano.\n\n**Pregunta para debate:** ¿Es éticamente justificable utilizar obras con derechos de autor para entrenar modelos de Inteligencia Artificial comerciales bajo el concepto de 'uso legítimo' (fair use)? ¿Cómo debería balancearse el progreso tecnológico con la propiedad intelectual?",
        "categoria_name": "Propiedad Intelectual"
    }
]

# Simulated news for the News Bot fallback
NOTICIAS_SIMULADAS = [
    {
        "titulo": "Europa multa a una red social con 400 millones por violar la privacidad infantil",
        "contenido": "Un organismo regulador europeo ha impuesto una multa multimillonaria a una conocida plataforma social al descubrirse que utilizaba algoritmos de recomendación que explotaban perfiles conductuales de menores de edad sin consentimiento explícito de sus padres. Además, las cuentas de los menores eran públicas por defecto.\n\n**Análisis:** Este caso reaviva el debate sobre el diseño de productos digitales éticos y la necesidad de priorizar la privacidad infantil sobre el engagement comercial.\n\n[Fuente Simulada: El Diario de Ética Digital](https://example.com/noticia-privacidad-menores)",
        "categoria_name": "Privacidad"
    },
    {
        "titulo": "Científicos alertan sobre el sesgo de género en herramientas de diagnóstico de salud por IA",
        "contenido": "Una investigación de universidades líderes revela que los modelos de Inteligencia Artificial para el diagnóstico precoz de enfermedades cardíacas fallan un 35% más en mujeres. El estudio concluyó que la base de datos de entrenamiento histórica contenía en su gran mayoría perfiles de pacientes masculinos, lo que llevó a la IA a pasar por alto síntomas atípicos en mujeres.\n\n**Análisis:** Los autores sugieren la creación de comités éticos multidisciplinarios para auditar los sets de datos médicos antes de cualquier despliegue hospitalario comercial.\n\n[Fuente Simulada: Salud & Ética Tecnológica](https://example.com/noticia-sesgo-salud-ia)",
        "categoria_name": "Inteligencia Artificial"
    },
    {
        "titulo": "Un fallo de seguridad masivo expone las credenciales de millones de dispositivos IoT hogareños",
        "contenido": "Especialistas en ciberseguridad han detectado que una popular marca de cerraduras y cámaras web inteligentes almacenaba las contraseñas en sus servidores en texto plano. La vulnerabilidad expone a millones de hogares a accesos no autorizados y robos físicos.\n\n**Análisis:** Expertos argumentan que las empresas que producen hardware 'inteligente' deben ser legalmente responsables de la seguridad por diseño en sus sistemas.\n\n[Fuente Simulada: CiberDefensa Global](https://example.com/fallo-iot-credenciales)",
        "categoria_name": "Ciberseguridad"
    },
    {
        "titulo": "Naciones Unidas urge a regular las tecnologías de reconocimiento facial en espacios públicos",
        "contenido": "La Oficina de Derechos Humanos de la ONU emitió un informe advirtiendo que los sistemas de videovigilancia con reconocimiento facial dinámico atentan contra el derecho a la reunión pacífica y el anonimato. Piden una moratoria global de estas tecnologías hasta que se establezcan salvaguardas claras.\n\n**Análisis:** El reconocimiento facial ha demostrado ser especialmente impreciso en personas de tez oscura, aumentando el riesgo de arrestos injustificados y discriminación racial.\n\n[Fuente Simulada: Derechos en la Red](https://example.com/onu-reconocimiento-facial)",
        "categoria_name": "Derechos Digitales"
    },
    {
        "titulo": "Artistas independientes demandan a una plataforma de código abierto por infracción de copyright",
        "contenido": "Una coalición internacional de ilustradores ha iniciado acciones legales colectivas contra un popular repositorio por permitir la descarga masiva de sus obras para el entrenamiento de generadores de arte sintético, argumentando que infringe las leyes de derechos de autor existentes y atenta contra su sustento laboral.\n\n**Análisis:** Este caso sentará precedentes legales cruciales sobre el límite entre el entrenamiento de IA y la piratería digital en el siglo XXI.\n\n[Fuente Simulada: Propiedad & Tecnología](https://example.com/artistas-demanda-ia)",
        "categoria_name": "Propiedad Intelectual"
    }
]

def get_category_by_name(name):
    """Utility to get or create Category securely inside bot script"""
    from forum.models import Category
    slug = slugify(name)
    category, _ = Category.objects.get_or_create(
        nombre=name,
        defaults={
            "slug": slug,
            "descripcion": f"Espacio dedicado al debate e información sobre {name}.",
            "icono": "Globe"
        }
    )
    return category

def run_news_bot():
    """Bot de noticias: busca noticias reales mediante NewsAPI o usa simulación premium"""
    logger.info("Bot de Noticias: Iniciando ejecución...")
    from forum.models import Post
    
    api_key = os.getenv("NEWS_API_KEY")
    articles = []
    
    if api_key:
        logger.info("Bot de Noticias: Buscando en NewsAPI...")
        keywords = ["privacidad datos", "inteligencia artificial ética", "ciberseguridad", "derechos digitales"]
        # Query NewsAPI
        for keyword in keywords:
            try:
                url = f"https://newsapi.org/v2/everything?q={keyword}&language=es&sortBy=publishedAt&pageSize=3&apiKey={api_key}"
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    for art in data.get("articles", []):
                        if art.get("title") and art.get("description"):
                            # Determine category based on keyword
                            category_name = "Derechos Digitales"
                            if "privacidad" in keyword or "datos" in keyword:
                                category_name = "Privacidad"
                            elif "inteligencia" in keyword or "ética" in keyword:
                                category_name = "Inteligencia Artificial"
                            elif "ciberseguridad" in keyword or "seguridad" in keyword:
                                category_name = "Ciberseguridad"
                            
                            articles.append({
                                "titulo": art["title"],
                                "contenido": f"{art['description']}\n\n[Leer noticia completa en la fuente]({art['url']})",
                                "categoria_name": category_name
                            })
            except Exception as e:
                logger.error(f"Error consultando NewsAPI para '{keyword}': {str(e)}")
                
    if not articles:
        logger.info("Bot de Noticias: No se obtuvieron noticias de NewsAPI (sin API key o error). Usando fallback de simulación de alta calidad...")
        # Fallback to simulated news
        import random
        # Choose a random news article that hasn't been posted recently
        articles = [random.choice(NOTICIAS_SIMULADAS)]
        
    posted_count = 0
    for art in articles:
        with transaction.atomic():
            # Check if post already exists to avoid duplicates
            if not Post.objects.filter(titulo=art["titulo"]).exists():
                cat = get_category_by_name(art["categoria_name"])
                Post.objects.create(
                    titulo=art["titulo"],
                    contenido=art["contenido"],
                    autor=None,
                    categoria=cat,
                    es_bot=True
                )
                posted_count += 1
                logger.info(f"Bot de Noticias: Noticia publicada '{art['titulo']}'")
                
    logger.info(f"Bot de Noticias: Finalizado. Se publicaron {posted_count} nuevas noticias.")

def run_dilema_bot():
    """Bot de Dilema Semanal: selecciona y publica un dilema ético predefinido"""
    logger.info("Bot de Dilema Semanal: Iniciando ejecución...")
    from forum.models import Post
    
    posted = False
    for dilema in DILEMAS_PREDEFINIDOS:
        # Check if this dilemma was already posted
        titulo_dilema = f"Dilema Ético Semanal: {dilema['titulo']}"
        if not Post.objects.filter(titulo=titulo_dilema).exists():
            with transaction.atomic():
                cat = get_category_by_name(dilema["categoria_name"])
                Post.objects.create(
                    titulo=titulo_dilema,
                    contenido=dilema["contenido"],
                    autor=None,
                    categoria=cat,
                    es_bot=True
                )
                posted = True
                logger.info(f"Bot de Dilema Semanal: Dilema publicado '{titulo_dilema}'")
                break
                
    if not posted:
        # If all dilemmas have been posted, choose a random one or reset
        import random
        dilema = random.choice(DILEMAS_PREDEFINIDOS)
        titulo_dilema = f"Dilema Ético Semanal (Especial): {dilema['titulo']}"
        # We append a unique timestamp to keep it unique
        timestamp = datetime.now().strftime("%d/%m/%Y")
        titulo_dilema_unique = f"{titulo_dilema} - [{timestamp}]"
        
        with transaction.atomic():
            cat = get_category_by_name(dilema["categoria_name"])
            Post.objects.create(
                titulo=titulo_dilema_unique,
                contenido=dilema["contenido"],
                autor=None,
                categoria=cat,
                es_bot=True
            )
            logger.info(f"Bot de Dilema Semanal: Dilema repetido publicado '{titulo_dilema_unique}'")
            
    logger.info("Bot de Dilema Semanal: Finalizado con éxito.")

# Singleton scheduler instance
scheduler = BackgroundScheduler()

def start():
    """Start the scheduler if it is not already running and under correct Django process"""
    # Prevent running multiple scheduler instances due to Django autoreloader
    if os.environ.get('RUN_MAIN') == 'true' or not os.getenv('DJANGO_DEBUG') == 'True':
        if not scheduler.running:
            logger.info("Iniciando APScheduler de EticaDigital en segundo plano...")
            
            # Bot de noticias cada 24 horas (86400 segundos)
            scheduler.add_job(run_news_bot, 'interval', seconds=86400, id='news_bot_job', replace_existing=True)
            
            # Bot de dilema semanal cada 7 días (604800 segundos)
            scheduler.add_job(run_dilema_bot, 'interval', seconds=604800, id='dilema_bot_job', replace_existing=True)
            
            scheduler.start()
            logger.info("APScheduler iniciado correctamente.")
            
            # Run both bots immediately on first startup if there are NO posts in the database,
            # ensuring the website starts with beautiful active content for the user!
            try:
                from forum.models import Post
                if not Post.objects.exists():
                    logger.info("Base de datos de posts vacía en primer inicio. Ejecutando bots inmediatamente...")
                    run_dilema_bot()
                    run_news_bot()
            except Exception as e:
                logger.error(f"Error inicializando contenido de bots en inicio: {str(e)}")
