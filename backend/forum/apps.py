from django.apps import AppConfig

class ForumConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'forum'

    def ready(self):
        # Start background scheduler for bots
        from . import scheduler
        scheduler.start()

