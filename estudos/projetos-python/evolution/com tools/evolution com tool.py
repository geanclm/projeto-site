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

from crewai import Agent, Task, Crew, Process
from classes import Brain, Tool, Parameter
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

def main():    
    pesquisador = Agent(
        role='Pesquisar dados acerca da Loteca e retornar uma tabela organizada em Markdown',
        goal='Fornecer previsão de resultado de cada jogo do referido concurso',
        backstory='Especialista em futebol que pesquisa a programação da Loteca e fornece previsões de resultados',
        tools=[Tool.scrape_ScrapeWebsiteTool],
        model=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False,
    )    
    pesquisador_task = Task(
        description="Buscar dados na URL: {urls} e organizar uma tabela Markdown com base no seguinte texto: {topic}",
        expected_output= "Concurso (número, data e dia da semana) "
        "Período de apostas: "
        "Realização dos jogos de futebol: "
        "Tabela Markdown com os jogos, clara e concisa em português do Brasil, e uma coluna extra com a previsão de resultado de cada jogo",
        agent=pesquisador,
        allow_delegation=False,
        output_file= Parameter.file_name
    )    
    crew = Crew(
        agents=[pesquisador],
        tasks=[pesquisador_task],
        process=Process.sequential
    )

    if crew:
        result = crew.kickoff(inputs={'topic': Parameter.prompt, 'urls': Parameter.urls})
        print(f'Arquivo "search_result.md" gerado com sucesso!')        
    else:
        print("A equipe (Crewai) não foi criada corretamente.")

if __name__ == "__main__":
    main()