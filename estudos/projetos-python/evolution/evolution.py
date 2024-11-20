# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# PROCEDIMENTO SEGURANÇA DAS CHAVES
# https://pypi.org/project/python-dotenv/
# pip install python-dotenv
from dotenv import load_dotenv
load_dotenv()
import os
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# Import Libs

from IPython.display import Markdown

# Warning control
import warnings
warnings.filterwarnings('ignore')

import logging
logging.getLogger('opentelemetry').setLevel(logging.ERROR)

from crewai import Agent, Task, Crew, Process, LLM

from crewai_tools import (
    ScrapeElementFromWebsiteTool, # Para extração precisa de dados, como elementos HTML específicos, títulos, ou parágrafos
    ScrapeWebsiteTool, # Para coleta de grandes volumes de dados de um site completo, ideal para análise web massiva
    FirecrawlCrawlWebsiteTool, # Faz crawling em um site completo, percorrendo múltiplas páginas
    FirecrawlScrapeWebsiteTool, # Faz scraping de uma única página web e retorna o conteúdo
    FirecrawlSearchTool, # 	Realiza buscas com palavras-chave em um site e retorna resultados
    SerperDevTool # search_tool
)
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


# classe com as LLMs
class brain:
    llama32_90b_vision_preview = LLM(model='groq/llama-3.2-90b-vision-preview')
    llama31_70b_versatile = LLM(model='groq/llama-3.1-70b-versatile')
    llama3_70b_8192 = LLM(model='groq/llama3-70b-8192')
    llama3_8b_8192 = LLM(model='groq/llama3-8b-8192')
    gemma2_9b_it = LLM(model='groq/gemma2-9b-it')
    gemma_7b_it = LLM(model='groq/gemma-7b-it')
    llava_v1_5_7b_4096_preview = LLM(model='groq/llava-v1.5-7b-4096-preview')
    mixtral_8x7b_32768 = LLM(model='groq/mixtral-8x7b-32768')    
    gemini_pro = LLM(model='gemini/gemini-pro')
    gemini_15_pro = LLM(model='gemini/gemini-1.5-pro')
    

class tool:
    scrape_ScrapeElementFromWebsiteTool = ScrapeElementFromWebsiteTool() # Ferramenta para scraping de elementos específicos de uma página web
    scrape_ScrapeWebsiteTool = ScrapeWebsiteTool() # Ferramenta para scraping de sites inteiros
    search_SerperDevTool = SerperDevTool() # com lmite de 2500 requisições no plano sem custo!
    
prompt = 'Consulte a tabela do concurso da Loteca na url {urls} e retorne os jogos de forma organizada em uma tabela Markdown com uma previsão de resultado para cada jogo.'

urls = f'https://bnldata.com.br/confira-a-programacao-do-concurso-1160-da-loteca-com-premio-de-r-14-milhao/'

    
def create_agent(role, goal, backstory, tools, model, max_iter, verbose, memory, allow_delegation):
    try:
        return Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            tools=tools,
            llm=model,
            max_iter=max_iter,
            verbose=verbose,
            memory=memory,
            allow_delegation=allow_delegation,
        )
    except Exception as e:
        print(f"Erro ao criar agente: {e}")
        return None

def create_task(description, expected_output, agent, allow_delegation):
    try:
        return Task(
            description=description,
            expected_output=expected_output,
            agent=agent,
            allow_delegation=allow_delegation,
            output_file='result.md'
        )
    except Exception as e:
        print(f"Erro ao criar tarefa: {e}")
        return None

def create_crew(agents, tasks):
    try:
        return Crew(
            agents=agents,
            tasks=tasks,
            process=Process.sequential
        )
    except Exception as e:
        print(f"Erro ao criar a equipe (crew): {e}")
        return None

# Função principal

def main():
    # Criar agente
    pesquisador = create_agent(
        role='Pesquisar dados acerca da Loteca e retornar um resumo em Markdown',
        goal='Fornecer informações e palpites de resultado de cada jogo do concurso da Loteca',
        backstory='Um especialista em futebol que pesquisa a programação do concurso da Loteca e fornece informações e palpites',
        tools=[tool.scrape_ScrapeWebsiteTool],
        model=brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False,
    )

    # Criar tarefa do agente
    pesquisador_task = create_task(
        description="Buscar dados na URL: {urls} e organizar uma tabela Markdown com base no seguinte texto: {topic}",
        expected_output="Tabela clara e concisa em português do Brasil.",
        agent=pesquisador,
        allow_delegation=False,
    )

    # Criar equipe (Crew) e atribuir tarefa
    crew = create_crew(
        agents=[pesquisador],
        tasks=[pesquisador_task]
    )

    if crew:
        result = crew.kickoff(inputs={'topic': prompt, 'urls': urls})
        # print(result)
        Markdown(result)
    else:
        print("A equipe (Crewai) não foi criada corretamente.")

if __name__ == "__main__":
    main()