# Testes com evolution_api_whatsapp
# by geanclm on 1/12/2024 18h

# pip install evolutionapi
from evolutionapi.client import EvolutionClient
from evolutionapi.models.message import TextMessage
from requests_toolbelt import MultipartEncoder # foi necessário instalar esse recurso para rodar o evolution_api

evolution_client = EvolutionClient(base_url="http://localhost:8080/", api_token="429683C4C977415CAAFCCE10F7D57E11")

evolution_instance_id = "domingo"
evolution_instance_token = "7D4EA9601D30-42E9-B6EF-9C1F698D876A"

text_message = TextMessage(
    number="5544999999999",    
    text="Hoje, consegui rodar o evolution_api com o whatsapp!" # primeiro teste realizado em 1 de dezembro de 2024 19:37h    
)

response = evolution_client.messages.send_text(
    evolution_instance_id,
    text_message,
    evolution_instance_token
)

# precisa fazer os ajustes no código para adaptar uma função
# salvar dados sensiveis em .env
