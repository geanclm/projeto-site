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
from classes import Brain, Tool, Parameter
from functions import create_agent, create_crew, create_task
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

def main():    
    pesquisador = create_agent(
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
    pesquisador_task = create_task(
        description="Buscar dados na URL: {urls} e organizar uma tabela Markdown com base no seguinte texto: {topic}",
        expected_output="Tabela clara e concisa em português do Brasil.",
        agent=pesquisador,
        allow_delegation=False,
        output_file= Parameter.file_name
    )    
    crew = create_crew(
        agents=[pesquisador],
        tasks=[pesquisador_task],
        process=Process.sequential
    )

    if crew:
        result = crew.kickoff(inputs={'topic': Parameter.prompt, 'urls': Parameter.urls})
        print(f'Arquivo "search_result.md" gerado com sucesso!')
        # Markdown(result)
    else:
        print("A equipe (Crewai) não foi criada corretamente.")

if __name__ == "__main__":
    main()