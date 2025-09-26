import json
import logging

logger = logging.getLogger(__name__)
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from .models import Message
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = self.scope['user']
            if not self.user.is_authenticated:
                logger.warning("ChatConsumer: Unauthenticated user connection attempt.")
                await self.close()
                return

            other_user_id = self.scope['url_route']['kwargs']['user_id']
            try:
                self.other_user = await sync_to_async(User.objects.get)(id=other_user_id)
            except User.DoesNotExist:
                logger.warning(f"ChatConsumer: Attempted to connect to non-existent user {other_user_id}.")
                await self.close()
                return

            # Create a unique room name for the pair of users
            if self.user.id < self.other_user.id:
                self.room_name = f'{self.user.id}_{self.other_user.id}'
            else:
                self.room_name = f'{self.other_user.id}_{self.user.id}'
            
            self.room_group_name = f'chat_{self.room_name}'

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"User {self.user.username} connected to chat room {self.room_group_name}.")
        except Exception as e:
            logger.error(f"Error in ChatConsumer.connect: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            logger.info(f"User {self.user.username} disconnected from chat room {self.room_group_name}.")
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        logger.info(f"Received message from {self.user.username}: {text_data}")
        try:
            text_data_json = json.loads(text_data)
            message_content = text_data_json['message']

            if not message_content.strip():
                logger.warning("Received empty message.")
                return

            message = await self.save_message(message_content)
            message_data = await self.serialize_message(message)

            # Add sender's name to the payload for frontend convenience
            message_data['sender_name'] = self.user.full_name or self.user.username

            logger.info(f"Broadcasting message to group {self.room_group_name}.")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data,
                }
            )
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(f"Error processing received message: {e}")

    async def chat_message(self, event):
        message = event['message']
        logger.info(f"Sending message to client {self.user.username}: {message}")

        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    @sync_to_async
    def save_message(self, message_content):
        return Message.objects.create(
            sender=self.user,
            recipient=self.other_user,
            content=message_content
        )

    @sync_to_async
    def serialize_message(self, message):
        return MessageSerializer(message).data
