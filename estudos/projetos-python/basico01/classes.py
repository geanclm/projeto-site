from dotenv import load_dotenv
import os
from evolutionapi.client import EvolutionClient
from evolutionapi.models.message import TextMessage, MediaMessage

class SendEvolution:        
    def __init__(self) -> None:
        # Carregar variáveis de ambiente
        load_dotenv()
        self.BASE_URL = os.getenv('base_url')
        self.API_TOKEN = os.getenv('api_token')
        self.EVOLUTION_INSTANCE_ID = os.getenv('evolution_instance_id')        
        self.EVOLUTION_INSTANCE_TOKEN = os.getenv('evolution_instance_token')                
        self.NUMBER = os.getenv('number_destino')
        self.GROUP_ID = os.getenv('groupJid')
        
        # Inicializar o cliente Evolution
        self.client = EvolutionClient(
            base_url=self.BASE_URL,
            api_token=self.API_TOKEN
        )        

    def textMessage(self, number, msg, mentions=[]):
        # Enviar mensagem de texto
        text_message = TextMessage(
            number=str(number),
            text=msg,
            mentioned=mentions
        )

        response = self.client.messages.send_text(
            self.EVOLUTION_INSTANCE_ID, 
            text_message, 
            self.EVOLUTION_INSTANCE_TOKEN
        )
        return response

    def PDF(self, number, pdf_file, caption=""):
        # Enviar PDF
        if not os.path.exists(pdf_file):
            raise FileNotFoundError(f"Arquivo '{pdf_file}' não encontrado.")
        
        media_message = MediaMessage(
            number=number,
            mediatype="document",
            mimetype="application/pdf",
            caption=caption,
            fileName=os.path.basename(pdf_file),
            media=""
        )
        
        self.client.messages.send_media(
            self.EVOLUTION_INSTANCE_ID, 
            media_message, 
            self.EVOLUTION_INSTANCE_TOKEN,            
            pdf_file
        )

    def audio(self, number, audio_file):
        # Enviar áudio
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Arquivo '{audio_file}' não encontrado.")

        audio_message = {
            "number": number,
            "mediatype": "audio",
            "mimetype": "audio/mpeg",
            "caption": ""
        }
            
        self.client.messages.send_whatsapp_audio(
            self.EVOLUTION_INSTANCE_ID,
            audio_message,
            self.EVOLUTION_INSTANCE_TOKEN,            
            audio_file
        )
                    
        return "Áudio enviado"

    def image(self, number, image_file, caption=""):
        # Enviar imagem
        if not os.path.exists(image_file):
            raise FileNotFoundError(f"Arquivo '{image_file}' não encontrado.")

        media_message = MediaMessage(
            number=number,
            mediatype="image",
            mimetype="image/jpeg",
            caption=caption,
            fileName=os.path.basename(image_file),
            media=""
        )

        self.client.messages.send_media(
            self.EVOLUTION_INSTANCE_ID, 
            media_message, 
            self.EVOLUTION_INSTANCE_TOKEN,            
            image_file
        )
        
        return "Imagem enviada"

    def video(self, number, video_file, caption=""):
        # Enviar vídeo
        if not os.path.exists(video_file):
            raise FileNotFoundError(f"Arquivo '{video_file}' não encontrado.")

        media_message = MediaMessage(
            number=number,
            mediatype="video",
            mimetype="video/mp4",
            caption=caption,
            fileName=os.path.basename(video_file),
            media=""
        )

        self.client.messages.send_media(
            self.EVOLUTION_INSTANCE_ID, 
            media_message, 
            self.EVOLUTION_INSTANCE_TOKEN,            
            video_file
        )
        
        return "Vídeo enviado"

    def document(self, number, document_file, caption=""):
        # Enviar documento
        if not os.path.exists(document_file):
            raise FileNotFoundError(f"Arquivo '{document_file}' não encontrado.")

        media_message = MediaMessage(
            number=number,
            mediatype="document",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            caption=caption,
            fileName=os.path.basename(document_file),
            media=""
        )

        self.client.messages.send_media(
            self.EVOLUTION_INSTANCE_ID, 
            media_message, 
            self.EVOLUTION_INSTANCE_TOKEN,            
            document_file
        )
        
        return "Documento enviado"
    
    
    
    # =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    def textMessageToGroup(self, groupJid, msg, mentions=[]):
        """
        Enviar mensagem de texto para um grupo.
        
        :param groupJid: ID do grupo no formato 'groupId@g.us'.
        :param msg: Conteúdo da mensagem.
        :param mentions: Lista de contatos a serem mencionados (opcional).
        """
        # Verificar se o ID do grupo está no formato correto
        if not groupJid.endswith("@g.us"):
            raise ValueError("O ID do grupo deve terminar com '@g.us'")
        
        # Enviar mensagem de texto para o grupo
        text_message = TextMessage(
            number=groupJid,  # Aqui entra o ID do grupo
            text=msg,
            mentioned=mentions
        )
        
        response = self.client.messages.send_text(
            self.EVOLUTION_INSTANCE_ID, 
            text_message, 
            self.EVOLUTION_INSTANCE_TOKEN
        )
        return response
    # =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=