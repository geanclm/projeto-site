# from flask import Flask, request
# from message_sandeco import MessageSandeco
# from classes import SendEvolution
# from dotenv import load_dotenv
# load_dotenv()
# import os
# import google.generativeai as genai

# GOOGLE_API_KEY = os.getenv('Google_My_First_Project')
# genai.configure(api_key=GOOGLE_API_KEY)

# # GROUP_ID = os.getenv('groupJid')
# llm_google = ['gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp-1219']
# model_google_gemini = genai.GenerativeModel(llm_google[0])

# def google_gemini(prompt):    
#     response_google_gemini = model_google_gemini.generate_content(prompt)        
#     return response_google_gemini.text

# app = Flask(__name__)

# @app.route("/")
# def hello():
#     return "Hello World!"

# @app.route("/messages-upsert", methods=['POST'])
# def webhook():
#     try:
#         data = request.get_json()
#         prompt = data['data']['message']['conversation']                
#         msg = MessageSandeco(data)                
#         send = SendEvolution()        
#         send.textMessage(number=msg.phone, msg=f'{google_gemini(prompt)}')        
#     except:
#         print("Erro")        
#     return ""

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)
    
#     -----------
    
from flask import Flask, request
from message_sandeco import MessageSandeco
from classes import SendEvolution
from dotenv import load_dotenv
from collections import defaultdict
import os
import google.generativeai as genai

# Configurações básicas
load_dotenv()
GOOGLE_API_KEY = os.getenv('Google_My_First_Project')
genai.configure(api_key=GOOGLE_API_KEY)

# Modelo Gemini
llm_google = ['gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp-1219']
model_google_gemini = genai.GenerativeModel(llm_google[0])

# Armazenamento do histórico
chat_history = defaultdict(list)

def google_gemini(prompt, phone):    
    # Obtém histórico da conversa
    history = chat_history[phone][-5:] if phone in chat_history else []
    
    # Monta o contexto com o histórico
    context = "\n".join([f"Humano: {h['human']}\nAssistente: {h['assistant']}" for h in history])
    
    # Prepara o prompt final
    full_prompt = f"{context}\n\nHumano: {prompt}\nAssistente:" if context else f"Humano: {prompt}\nAssistente:"
    
    # Gera resposta
    response = model_google_gemini.generate_content(full_prompt)
    response_text = response.text.strip()
    
    # Atualiza histórico
    chat_history[phone].append({
        'human': prompt,
        'assistant': response_text
    })
    
    return response_text

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/messages-upsert", methods=['POST'])
def webhook():
    try:
        data = request.get_json()
        prompt = data['data']['message']['conversation']                
        msg = MessageSandeco(data)                
        send = SendEvolution()        
        send.textMessage(number=msg.phone, msg=google_gemini(prompt, msg.phone))        
    except:
        print("Erro")        
    return ""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)