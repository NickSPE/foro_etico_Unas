from django.db import migrations
from django.utils.text import slugify

def create_default_categories(apps, schema_editor):
    Category = apps.get_model('forum', 'Category')
    
    categories = [
        {
            "nombre": "Privacidad",
            "descripcion": "Protección de datos personales, vigilancia masiva, anonimato y soberanía de la información en el entorno digital.",
            "icono": "EyeOff"
        },
        {
            "nombre": "Inteligencia Artificial",
            "descripcion": "Implicaciones éticas del aprendizaje automático, sesgo algorítmico, automatización, decisiones autónomas y el futuro de la humanidad.",
            "icono": "Brain"
        },
        {
            "nombre": "Ciberseguridad",
            "descripcion": "Protección de infraestructuras críticas, hacktivismo, vulnerabilidades, ciberguerras y la ética del hacking y la defensa digital.",
            "icono": "Shield"
        },
        {
            "nombre": "Derechos Digitales",
            "descripcion": "Libertad de expresión en internet, acceso universal a la red, neutralidad de la red y derechos fundamentales de los internautas.",
            "icono": "Globe"
        },
        {
            "nombre": "Propiedad Intelectual",
            "descripcion": "Derechos de autor, licencias de código abierto (open source), patentes de software, piratería y el dilema del libre acceso al conocimiento.",
            "icono": "Copyright"
        }
    ]

    for cat in categories:
        Category.objects.get_or_create(
            nombre=cat["nombre"],
            defaults={
                "slug": slugify(cat["nombre"]),
                "descripcion": cat["descripcion"],
                "icono": cat["icono"]
            }
        )

def remove_default_categories(apps, schema_editor):
    Category = apps.get_model('forum', 'Category')
    Category.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, reverse_code=remove_default_categories),
    ]
