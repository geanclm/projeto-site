# evolution_api_whatsapp
# by geanclm on 1/12/2024 18h
# update by geanclm on 4/1/2025 18h30

# faz busca por ambientes virtuais no computador em pastsa especifica
# dir /s /b "C:\caminho\para\sua\pasta" | findstr /i "venv"

# pip install evolutionapi
import datetime
from requests_toolbelt import MultipartEncoder # foi necessário instalar esse recurso para rodar o evolution_api
from classes import SendEvolution
from dotenv import load_dotenv

load_dotenv()
import os

NUMBER = os.getenv('number_destino')
# GROUP_ID = os.getenv('groupJid')

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# data e hora
datahora = datetime.datetime.now()
# Arredondar os segundos
segundo_arredondado = (datahora.second + 1) if datahora.microsecond >= 500000 else datahora.second
datahora_arredondada = datahora.replace(second=segundo_arredondado, microsecond=0)
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

texto = f'{datahora_arredondada},\nOlá! Eu sou um agente IA criado por geanclm. Estamos em fase de teste. Em breve estarei disponível para atendimento. Obrigado! 🤖👨‍💻'

enviar = SendEvolution()

# response = enviar.textMessageToGroup(GROUP_ID=GROUP_ID, msg=texto, )
response = enviar.textMessage(number=NUMBER, msg=texto)
# response = enviar.image(number=NUMBER, image_file='./img/example.jpg', caption='Imagem enviada via evolution_api')
# response = enviar.PDF(number=NUMBER, pdf_file='./doc/Attention Is All You Need.pdf', caption='PDF enviado via evolution_api')