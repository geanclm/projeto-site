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
    research_agent = Agent(
        role='Pesquisador da programação de jogos da Loteca',
        goal='Buscar os dados da {topic} via API e organizá-los em uma tabela clara e compreensível, no formato Markdown, para uso posterior.',
        backstory='Você é um pesquisador metódico responsável por garantir que as informações sobre {topic} sejam organizadas '
        'e precisas. Seu trabalho inicial é a base para todas as análises subsequentes do projeto.',        
        tools=[Tool.scrape_ScrapeWebsiteTool, Tool.programacao_loteca_tool],
        llm=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False
    )    
    research_agent_task = Task(
        description='Buscar os dados referentes à {topic} via API e organizá-los em uma tabela Markdown limpa e estruturada, '
        'pronta para análises subsequentes.',        
        expected_output= 'Tabela Markdown com a programação da Loteca, incluindo todos os detalhes necessários para análise.',
        agent=research_agent,
        allow_delegation=False,
        output_file= 'programacao.md'
    )    
    
    analyst_agent = Agent(
        role='Analista de dados estatísticos e históricos sobre os jogos da {topic}',        
        goal='Pesquisar informações adicionais relevantes (estatísticas de equipes, histórico de confrontos, condições recentes) nas fontes ' 'fornecidas em {urls} e calcular dados úteis para as previsões dos jogos.',
        backstory='Atue como um analista especializado em futebol com acesso a ferramentas avançadas de busca. Sua missão é fornecer '
        'informações ricas e contextuais que complementam a programação dos jogos e ajudam na elaboração de previsões precisas.',        
        tools=[Tool.scrape_ScrapeWebsiteTool, Tool.search_SerperDevTool, Tool.scrape_ScrapeElementFromWebsiteTool],
        llm=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False
    )    
    analyst_agent_task = Task(
        description='Pesquisar dados relevantes sobre cada jogo da {topic}, incluindo estatísticas de equipes, histórico de confrontos '
        'e outros fatores importantes, para complementar a análise e formulação de previsões.',
        expected_output= 'Informações adicionais sobre cada jogo organizadas e com destaque para fatores que possam influenciar o resultado.',
        agent=analyst_agent,
        allow_delegation=False,
        input_file='programacao.md',
        output_file= 'dados_extras.md'
    )    
    
    forecasting_agent = Agent(
        role='Especialista em previsões de resultados de jogos de futebol da {topic}',        
        goal='Integrar os dados da programação dos jogos e os insights estatísticos coletados para criar previsões precisas '
        'dos resultados de cada partida, apresentando-as em um formato de tabela final.',
        backstory='Você é um especialista em futebol com profundo conhecimento de estatísticas e histórico esportivo. '
        'Seu objetivo é combinar a programação dos jogos e os dados detalhados para formular previsões confiáveis '
        'e organizá-las de forma clara.',        
        # tools=[Tool.scrape_ScrapeWebsiteTool, Tool.search_SerperDevTool],
        llm=Brain.llama32_90b_vision_preview,
        max_iter=1,
        verbose=True,
        memory=True,
        allow_delegation=False
    )    
    forecasting_agent_task = Task(
        description='Com base nos dados da {topic} e nas estatísticas adicionais, gerar previsões detalhadas '
        'para cada jogo da Loteca e apresentá-las em uma tabela Markdown com uma coluna extra contendo as previsões.',           
        expected_output= Parameter.expected_output,
        agent=forecasting_agent,
        allow_delegation=False,
        output_file= Parameter.file_name,
    )
        
    crew = Crew(
        agents=[research_agent, analyst_agent, forecasting_agent],
        tasks=[research_agent_task, analyst_agent_task, forecasting_agent_task],
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