# AMBIENTE VIRTUAL
# Para evitar conflitos entre dependências de projetos diferentes é possível criar ambientes virtuais para cada projeto:

# 0 - where python (comando para localizar o Python no computador)
# 1 - python -m venv venv
# 2 - definir a diretiva de execução para o computador local através do PowerShell:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
# 3 - .\Scripts\activate                                                       # ativar o env
# 4 - deactivate                                                               # desativar o env   
# 5 - pip list                                                                 # listar as dependências do env
# 6 - pip freeze > requirements.txt                                            # salvar a lista de dependências do env
# 6 - pip install -r requirements.txt                                          # instalar todas as dependências usadas no projeto

print('arquivo principal do projeto Python.py')
print('---')

print("\033[92m Texto verde \033[0m")
print("\033[92m Texto verde - linha adiionada pelo GitHub \033[0m") # linha inserida no editor do GitHub em 31 de outubro de 2024 6:19h