from dotenv import load_dotenv
load_dotenv()
import os

import google.generativeai as genai
GOOGLE_API_KEY = os.getenv('Google_My_First_Project')
genai.configure(api_key=GOOGLE_API_KEY)

# GROUP_ID = os.getenv('groupJid')
llm_google = ['gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp-1219']
model_google_gemini = genai.GenerativeModel(llm_google[1])


def google_gemini(prompt):    
    response_google_gemini = model_google_gemini.generate_content(prompt)        
    return response_google_gemini.text

prompt = 'Qual é a capital do Brasil e da França?'

resposta = google_gemini(prompt)
print(resposta)