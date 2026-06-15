from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, PostViewSet, UserRegisterView, ChatAPIView, TriggerBotPostingAPIView, ProyectoAuditoriaViewSet

router = DefaultRouter()
router.register(r'categorias', CategoryViewSet, basename='categoria')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'auditorias', ProyectoAuditoriaViewSet, basename='auditoria')

urlpatterns = [
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('chat/', ChatAPIView.as_view(), name='chat_proxy'),
    path('bots/trigger/', TriggerBotPostingAPIView.as_view(), name='trigger_bot'),
    path('', include(router.urls)),
]
