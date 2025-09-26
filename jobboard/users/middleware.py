import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

@database_sync_to_async
def get_user(token_key):
    try:
        # Move get_user_model() inside the function
        User = get_user_model()
        
        # Get JWT algorithm from settings, default to HS256
        algorithm = getattr(settings, 'SIMPLE_JWT', {}).get('ALGORITHM', 'HS256')
        payload = jwt.decode(token_key, settings.SECRET_KEY, algorithms=[algorithm])
        user = User.objects.get(id=payload['user_id'])
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist, KeyError):
        return None

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Parse query string to get token
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = {}
        
        if query_string:
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    query_params[key] = value

        token = query_params.get('token')

        if token:
            scope['user'] = await get_user(token)
        else:
            # Set anonymous user if no token provided
            from django.contrib.auth.models import AnonymousUser
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)