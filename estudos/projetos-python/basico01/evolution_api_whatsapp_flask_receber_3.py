from flask import Flask, request
from message_sandeco import MessageSandeco
from classes import SendEvolution
from dotenv import load_dotenv
import os
import google.generativeai as genai
from collections import defaultdict
import re

# Carregar variáveis de ambiente
load_dotenv()
GOOGLE_API_KEY = os.getenv('Google_My_First_Project')

# Configurar Gemini
genai.configure(api_key=GOOGLE_API_KEY)
LLM_GOOGLE = 'gemini-2.0-flash-thinking-exp-1219'
model_google_gemini = genai.GenerativeModel(LLM_GOOGLE)

app = Flask(__name__)

# Dicionário para armazenar histórico de conversas por número de telefone
chat_history = defaultdict(list)

def clean_response(text):
    """
    Limpa a resposta removendo o processo de pensamento inicial
    """
    # Padrões comuns que indicam o início da resposta real
    markers = [
        r"Here's a thinking process.*?answer:",
        r"Let me think about this step by step:.*?\n\n",
        r"Here's how I'll approach this:.*?\n\n",
        r"Let me break this down:.*?\n\n",
        r"To answer this question:.*?\n\n",
        r"Here's my thought process:.*?\n\n",
        r"Thinking through this:.*?\n\n",
        r"Let me analyze this:.*?\n\n",
        r"^.*?(?=Assistente:)",
    ]
    
    cleaned_text = text
    for marker in markers:
        cleaned_text = re.sub(marker, "", cleaned_text, flags=re.DOTALL)
    
    # Remove "Assistente:" se presente
    cleaned_text = re.sub(r"^Assistente:\s*", "", cleaned_text.strip())
    
    # Remove linhas em branco extras
    cleaned_text = re.sub(r"\n\s*\n", "\n\n", cleaned_text)
    
    return cleaned_text.strip()

def process_gemini_response(message, phone_number):
    """
    Processa a mensagem usando o modelo Gemini mantendo histórico
    """
    history = chat_history[phone_number]
    
    # Prepara o contexto com o histórico limpo
    context = "\n".join([f"Humano: {msg['human']}\nAssistente: {msg['assistant']}" 
                        for msg in history[-5:]])
    
    # Adiciona instrução específica para formato da resposta
    system_prompt = "Forneça apenas a resposta direta, sem explicar seu processo de pensamento. Responda em português de forma natural e direta."
    
    if context:
        prompt = f"{system_prompt}\n\n{context}\n\nHumano: {message}\nAssistente:"
    else:
        prompt = f"{system_prompt}\n\nHumano: {message}\nAssistente:"

    try:
        response = model_google_gemini.generate_content(prompt)
        response_text = clean_response(response.text)
        
        # Atualiza o histórico com a resposta limpa
        chat_history[phone_number].append({
            'human': message,
            'assistant': response_text
        })
        
        return response_text
    except:
        return "Desculpe, ocorreu um erro ao processar sua mensagem."

def extract_message_text(data):
    """
    Extrai o texto da mensagem do JSON recebido
    """
    try:
        return data['data']['message']['conversation']
    except:
        return None

@app.route("/messages-upsert", methods=['POST'])
def webhook():
    try:
        data = request.get_json()
        message_text = extract_message_text(data)
        
        if not message_text:
            return ""
            
        msg = MessageSandeco(data)
        response = process_gemini_response(message_text, msg.phone)
        
        send = SendEvolution()
        send.textMessage(number=msg.phone, msg=response)
        
        return ""
        
    except:
        return ""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)