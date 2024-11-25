# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# PROCEDIMENTO SEGURANÇA DAS CHAVES
# https://pypi.org/project/python-dotenv/
# pip install python-dotenv
from dotenv import load_dotenv
load_dotenv()
import os
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
from IPython.display import Markdown

# Warning control
import warnings
warnings.filterwarnings('ignore')

import logging
logging.getLogger('opentelemetry').setLevel(logging.ERROR)

from crewai import Process
from classes import Brain, Tool, Parameter, Create_Agent, Create_Task, Create_Crew
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
 

def main():    
    pesquisador = Create_Agent.create(
        role='Pesquisar dados acerca da Loteca e retornar um resumo em Markdown',
        goal='Fornecer informações e palpites de resultado de cada jogo do concurso da Loteca',
        backstory='Um especialista em futebol que pesquisa a programação do concurso da Loteca e fornece informações e palpites',
        tools=[Tool.scrape_ScrapeWebsiteTool],
        model=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False,
    )    
    pesquisador_task = Create_Task.create(
        description="Buscar dados na URL: {urls} e organizar uma tabela Markdown com base no seguinte texto: {topic}",
        expected_output="Tabela clara e concisa em português do Brasil.",
        agent=pesquisador,
        allow_delegation=False,
        output_file="search_result.md",        
    )    
    crew = Create_Crew.create(
        agents=[pesquisador],
        tasks=[pesquisador_task],
        process=Process.sequential        
    )
    if crew:
        result = crew.kickoff(inputs={'topic': Parameter.prompt, 'urls': Parameter.urls})
        print("Arquivo 'search_result.md' criado com sucesso.")
        # Markdown(result)
    else:
        print("A equipe (Crewai) não foi criada corretamente.")

if __name__ == "__main__":
    main()