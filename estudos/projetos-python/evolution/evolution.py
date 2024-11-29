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
        # role='Pesquisar dados da Loteca e retornar uma tabela organizada em Markdown',
        role='Pesquisador da programação de jogos da {topic}',        
        # goal='Fornecer informação e previsão de resultado para cada jogo da Loteca',
        goal='Buscar os dados via API e organizá-los em uma tabela clara e compreensível, no formato Markdown.',        
        backstory='Especialista em futebol que pesquisa a programação do concurso da Loteca e fornece informações e palpites',                
        tools=[Tool.scrape_ScrapeWebsiteTool, Tool.programacao_loteca_tool],
        llm=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False
    )    
    pesquisador_task = Task(
        description="Buscar dados na URL: {urls} e organizar uma tabela Markdown com base no seguinte texto: {topic}",            
        expected_output= Parameter.expected_output,
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
        print(f'Arquivo "{Parameter.file_name}" gerado com sucesso!')
        # Markdown(result)
    else:
        print("A equipe (Crewai) não foi criada corretamente.")

if __name__ == "__main__":
    main()