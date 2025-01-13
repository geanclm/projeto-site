# evolution_api_whatsapp
# by geanclm on 1/12/2024 18h
# update by geanclm on 2/12/2024 20h

from dotenv import load_dotenv
load_dotenv()
import os
BASE_URL = os.getenv('base_url')
API_TOKEN = os.getenv('api_token')
EVOLUTION_INSTANCE_ID = os.getenv('evolution_instance_id')
EVOLUTION_INSTANCE_TOKEN = os.getenv('evolution_instance_token')
NUMBER = os.getenv('number')

# pip install evolutionapi
from evolutionapi.client import EvolutionClient
from evolutionapi.models.message import TextMessage, MediaMessage
from requests_toolbelt import MultipartEncoder # foi necessário instalar esse recurso para rodar o evolution_api

evolution_client = EvolutionClient(
    base_url=BASE_URL,
    api_token=API_TOKEN
    )

def enviar(number: str, text: str) -> dict:
# def enviar(number: str, text: str, media_path: str) -> dict:
# def enviar(group_id: str, text: str) -> dict:
    try:        
        text_message = TextMessage(number=number, text=text)
        # media_message = MediaMessage(number=number, caption=text, media=open(media_path, 'rb'))
        # text_message = TextMessage(number=group_id, text=text)
        
        response = evolution_client.messages.send_text(EVOLUTION_INSTANCE_ID, text_message, EVOLUTION_INSTANCE_TOKEN)         
        # response = evolution_client.messages.send_media(EVOLUTION_INSTANCE_ID, media_message, EVOLUTION_INSTANCE_TOKEN)        
        
        return response
    
    except Exception as e:        
        return {"error": str(e)}

# group_id = "1234567890@g.us"
if __name__ == "__main__":    
    enviar(
        number=NUMBER,
        # text='Hoje, consegui rodar o evolution_api com o whatsapp!' # primeiro teste realizado em 1 de dezembro de 2024
        text='segunda-feira, uma nova mensagem para o whatsapp via evolution_api',
        # text='Confira essa imagem incrível novamente!',
        # media_path='./img/example.jpg'        
        )