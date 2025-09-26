import os
import django
from django.core.asgi import get_asgi_application

   # Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobboard.settings')
django.setup()

   # Import these AFTER django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from users.middleware import TokenAuthMiddleware
import users.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            users.routing.websocket_urlpatterns
        )
    ),
})