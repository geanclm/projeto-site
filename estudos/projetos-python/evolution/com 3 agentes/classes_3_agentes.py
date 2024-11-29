import requests
import pandas as pd
from crewai import Agent, Task, Crew, LLM
from crewai_tools import BaseTool
from pydantic import BaseModel
from typing import List
from crewai_tools import (
    ScrapeElementFromWebsiteTool, # Para extração precisa de dados, como elementos HTML específicos, títulos, ou parágrafos
    ScrapeWebsiteTool, # Para coleta de grandes volumes de dados de um site completo, ideal para análise web massiva
    FirecrawlCrawlWebsiteTool, # Faz crawling em um site completo, percorrendo múltiplas páginas
    FirecrawlScrapeWebsiteTool, # Faz scraping de uma única página web e retorna o conteúdo
    FirecrawlSearchTool, # 	Realiza buscas com palavras-chave em um site e retorna resultados
    SerperDevTool # search_tool
)
import datetime

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

class Parameter:
    loteca = '1161'
    separador = '_'
    hoje = str(datetime.datetime.today().date())    
    
    # urls = ['https://clubedaposta.com/loterias/palpites-loteca/palpites-loteca-1161-palpites-loteca-semana/','https://www.uol.com.br/apostas/palpites/','https://blog.guiadaloteria.com.br/loteca/programacao','# https://www.romers.com.br/', 'https://jornalheiros.blogspot.com/2024/11/loteca-programacao-do-concurso-1161.html','https://bnldata.com.br/confira-a-programacao-do-concurso-1161-da-loteca-com-premio-de-r-200-mil/','https://clubedaposta.com/loterias/palpites-loteca/palpites-loteca-1161-palpites-loteca-semana/']

    urls = ['https://clubedaposta.com/loterias/palpites-loteca/palpites-loteca-1161-palpites-loteca-semana/']
        
    prompt = f'Programação Loteca - Concurso {loteca} - Caixa Economica Federal - Brasil'
        
    part1 = 'search_result'
    part2 = '.md'
    file_name = part1+separador+loteca+separador+hoje+part2
    
    expected_output =f'''Utilizando os dados obtidos via API, forneça as informações formatadas das variáveis **'concurso'**, **'periodo'** e **'realizacao'** seguindo rigorosamente o exemplo abaixo:
    
    - **Concurso**: Identifique o número do concurso e a data de início, indicando o dia da semana. Formate a saída como no exemplo:  
    `Concurso 1160 (23/11/2024, sábado)`

    - **Período de apostas**: Indique o intervalo exato para as apostas, incluindo a data de início e a data e horário de término. Formate a saída como no exemplo:  
    `Período de apostas: 20/11/2024 até as 15h do dia 23/11/2024`

    - **Realização dos jogos**: Informe o período de realização dos jogos, indicando o intervalo entre as datas inicial e final. Formate a saída como no exemplo:  
    `Realização dos jogos de futebol: de 23/11/2024 a 24/11/2024`

    ### Instruções Adicionais:
    1. Certifique-se de que as informações extraídas estão corretamente associadas às variáveis fornecidas pela API.
    2. Valide as datas e horários, garantindo que os valores retornados estejam formatados no padrão **dd/mm/aaaa**, com o dia da semana quando necessário.
    3. Apresente a saída final de forma clara, mantendo o mesmo formato exibido nos exemplos acima.    
        
    Para a geração da tabela dos jogos da Loteca, siga rigorosamente as etapas abaixo, garantindo que o conteúdo seja claro e conciso, em português do Brasil:        
    1. **Criação de Tabela em Markdown**: Organize uma tabela em formato Markdown para fácil visualização e compreensão. A tabela deve ser clara e incluir uma coluna adicional com a previsão de resultado de cada jogo.

    2. **Estrutura da Tabela**: Tabela Markdown final com as previsões de cada jogo, organizada de forma clara e objetiva com as seguintes colunas:    
    - **Jogo**: Número sequencial do jogo (1 a 14).
    - **UF1**: Sigla da unidade federativa (estado) do time mandante.
    - **Mandante**: Nome completo do time mandante.
    - **Visitante**: Nome completo do time visitante.
    - **UF2**: Sigla da unidade federativa (estado) do time visitante.
    - **Dia da semana**: Indicação do dia da semana (Sábado ou Domingo).
    - **Data**: Data exata da partida.
    - **Previsão de resultado**: Resultado previsto para o jogo. Utilize as letras:
        - **'m'** para indicar vitória do **mandante**.
        - **'e'** para indicar **empate**.
        - **'v'** para indicar vitória do **visitante**.

    3. **Geração das Previsões**: Baseie a previsão de resultado em análises realistas e bem fundamentadas. Considere informações relevantes como:
    - Desempenho recente das equipes.
    - Estatísticas históricas de confrontos.
    - Análise de especialistas esportivos confiáveis (sites ou vídeos de comentaristas do YouTube).

    4. **Formato Final**: Certifique-se de que a tabela gerada siga exatamente o formato especificado e apresente todas as informações organizadas. Um exemplo ilustrativo do formato da tabela em Markdown é:
    ```markdown
    | Jogo | UF1 | Mandante          | Visitante         | UF2 | Dia da semana | Data       | Previsão |
    |------|-----|-------------------|-------------------|-----|---------------|------------|----------|
    | 1    | GO  | Atlético-GO       | Palmeiras-SP      | SP  | Sábado        | 23/11/2024 | v        |
    | 2    | RJ  | Botafogo-RJ       | Vitória-BA        | BA  | Sábado        | 23/11/2024 | m        |
    | ...  | ... | ...               | ...               | ... | ...           | ...        | ...      |
    ```

    5. **Entrega Completa**: Após gerar a tabela, verifique se todas as colunas foram preenchidas corretamente e se as previsões seguem os critérios estabelecidos.'''    
    
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


# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Custom tool    
class LotecaResponse(BaseModel):
    concurso: str
    periodo: str
    realizacao: str
    jogos: List[dict]  # Lista de jogos estruturados
    
    

class ProgramacaoLotecaTool(BaseTool):
    name: str = 'Ferramenta para buscar a programação da Loteca'
    description: str = 'Busca, via API, a programação dos jogos do concurso da Loteca da CAIXA ECONÔMICA FEDERAL'

    # def _run(self, argument: str) -> str:
    def _run(self, argument: str) -> LotecaResponse:    
        url_loteca_programacao = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/loteca/programacao'
        
        try:
            # Fazendo a requisição para a API
            response = requests.get(url_loteca_programacao, timeout=10)  # Adicionado timeout
            response.raise_for_status()  # Levanta exceções para status de erro HTTP

            # Convertendo a resposta para JSON
            data_loteca_programacao = response.json()

            # Validação básica de estrutura
            if not data_loteca_programacao or "listaJogos" not in data_loteca_programacao[0]:
                raise ValueError("Resposta da API inesperada: 'listaJogos' ausente.")

            # Processamento dos dados
            lista_jogos_programacao = data_loteca_programacao[0]['listaJogos']
            df_loteca_programacao = pd.DataFrame(lista_jogos_programacao)

            # Reorganizando as colunas
            new_column_order = ['nuConcurso', 'nuGolEquipeUm', 'siglaUFUm', 'nomeEquipeUm', 'nomeEquipeDois', 'siglaUFDois', 'nuGolEquipeDois', 'nuSequencial', 'diaSemana', 'dtJogo']
            df_loteca_programacao = df_loteca_programacao[new_column_order]
            df_loteca_programacao = df_loteca_programacao.rename(columns={
                'nuConcurso': 'concurso',
                'dtJogo': 'data',
                'nuGolEquipeUm': 'gols_coluna1',
                'nomeEquipeUm': 'coluna1',
                'nomeEquipeDois': 'coluna2',
                'nuGolEquipeDois': 'gols_coluna2',
                'diaSemana': 'semana',
                'nuSequencial': 'jogo',
                'siglaUFUm': 'uf1',
                'siglaUFDois': 'uf2',
            })
            df_loteca_programacao.set_index('jogo', inplace=True)
            df_loteca_programacao['data'] = pd.to_datetime(df_loteca_programacao['data'], dayfirst=True)
            df_loteca_programacao.drop(columns=['concurso', 'gols_coluna1', 'gols_coluna2'], inplace=True)

            # Construindo a saída formatada
            concurso_api = f'Concurso {data_loteca_programacao[0]["nuConcurso"]} ({data_loteca_programacao[0]["dataFimApostas"]}, {data_loteca_programacao[0]["diaSemana"].lower()})'
            periodo_api = f'Período de apostas: {data_loteca_programacao[0]["dataInicioApostas"]} até as {data_loteca_programacao[0]["horarioFimApostas"]}h do dia {data_loteca_programacao[0]["dataFimApostas"]}'
            realizacao_api = f'Realização dos jogos de futebol: de {data_loteca_programacao[0]["dataInicioRealizacaoJogos"]} até {data_loteca_programacao[0]["dataFimRealizacaoJogos"]}'

            # Saída final como string
            # return f"{concurso_api}\n{periodo_api}\n{realizacao_api}\n{df_loteca_programacao.to_markdown()}"
            return LotecaResponse(concurso=concurso_api,
                                  periodo=periodo_api,
                                  realizacao=realizacao_api,
                                  tabela=df_loteca_programacao.to_markdown()).json()

        except requests.exceptions.RequestException as e:
            return f"Erro ao acessar a API: {e}"
        except Exception as e:
            return f"Erro inesperado: {e}"
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Custom tool



class Tool:
    scrape_ScrapeElementFromWebsiteTool = ScrapeElementFromWebsiteTool() # Ferramenta para scraping de elementos específicos de uma página web
    scrape_ScrapeWebsiteTool = ScrapeWebsiteTool() # Ferramenta para scraping de sites inteiros
    search_SerperDevTool = SerperDevTool() # com lmite de 2500 requisições no plano sem custo!
    programacao_loteca_tool = ProgramacaoLotecaTool() # faz leitura da programação da Loteca via API da Caixa