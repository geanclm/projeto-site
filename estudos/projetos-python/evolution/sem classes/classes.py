from crewai import Agent, Task, Crew, LLM

from crewai_tools import (
    ScrapeElementFromWebsiteTool, # Para extração precisa de dados, como elementos HTML específicos, títulos, ou parágrafos
    ScrapeWebsiteTool, # Para coleta de grandes volumes de dados de um site completo, ideal para análise web massiva
    FirecrawlCrawlWebsiteTool, # Faz crawling em um site completo, percorrendo múltiplas páginas
    FirecrawlScrapeWebsiteTool, # Faz scraping de uma única página web e retorna o conteúdo
    FirecrawlSearchTool, # 	Realiza buscas com palavras-chave em um site e retorna resultados
    SerperDevTool # search_tool
)

# classe com as LLMs
class Brain:
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
    
class Tool:
    scrape_ScrapeElementFromWebsiteTool = ScrapeElementFromWebsiteTool() # Ferramenta para scraping de elementos específicos de uma página web
    scrape_ScrapeWebsiteTool = ScrapeWebsiteTool() # Ferramenta para scraping de sites inteiros
    search_SerperDevTool = SerperDevTool() # com lmite de 2500 requisições no plano sem custo!

class Parameter:    
    prompt = 'Consulte a tabela do concurso da Loteca na url {urls} e retorne os jogos de forma organizada em uma tabela Markdown com uma previsão de resultado para cada jogo.',
    # urls = ['https://loterias.caixa.gov.br/Paginas/Programacao-Loteca.aspx', 'https://www.romers.com.br/', 'https://blog.guiadaloteria.com.br/loteca/programacao', 'https://jornalheiros.blogspot.com/2024/11/loteca-programacao-do-concurso-1160.html', 'https://bnldata.com.br/confira-a-programacao-do-concurso-1160-da-loteca-com-premio-de-r-14-milhao/'],
    urls = ['https://www.romers.com.br/'],
    file_name = "search_result.md"
    
class Create_Agent:
    """Classe para criação e gerenciamento de agentes."""
    def __init__(self, role, goal, backstory, tools, model, max_iter, verbose, memory, allow_delegation):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.tools = tools
        self.model = model
        self.max_iter = max_iter
        self.verbose = verbose
        self.memory = memory
        self.allow_delegation = allow_delegation

    @staticmethod
    def create(role, goal, backstory, tools, model, max_iter, verbose, memory, allow_delegation):
        """Fábrica estática para criação de agentes."""
        try:
            return Agent(
                role=role,
                goal=goal,
                backstory=backstory,
                tools=tools,
                model=model,
                max_iter=max_iter,
                verbose=verbose,
                memory=memory,
                allow_delegation=allow_delegation,
            )
        except Exception as e:
            print(f"Erro ao criar agente: {e}")
            return None        
        
class Create_Task:
    """Classe para criação e gerenciamento de tarefas."""
    def __init__(self, description, expected_output, agent, allow_delegation, output_file='result.md'):
        self.description = description
        self.expected_output = expected_output
        self.agent = agent
        self.allow_delegation = allow_delegation
        self.output_file = output_file

    @staticmethod
    def create(description, expected_output, agent, allow_delegation, output_file):
        """Fábrica estática para criação de tarefas."""
        try:
            return Task(
                description=description,
                expected_output=expected_output,
                agent=agent,
                allow_delegation=allow_delegation,
                output_file=output_file
            )
        except Exception as e:
            print(f"Erro ao criar tarefa: {e}")
            return None
              
class Create_Crew:
    """Classe para gerenciamento de equipes e tarefas."""
    def __init__(self, agents, tasks, process):
        self.agents = agents
        self.tasks = tasks
        self.process = process

    @staticmethod
    def create(agents, tasks, process):
        """Fábrica estática para criação de equipes."""
        try:
            return Crew(agents=agents, tasks=tasks, process=process)
        except Exception as e:
            print(f"Erro ao criar equipe (crew): {e}")
            return None

    def kickoff(self, inputs):
        """Método para iniciar a execução das tarefas."""
        try:
            # Aqui está o ponto onde a execução ocorre.
            return "Execução concluída com sucesso!"  # Substitua por chamada real da API de execução
        except Exception as e:
            print(f"Erro durante a execução: {e}")
            return None