# AMBIENTE VIRTUAL
# - - -
# where python
# - - -
# Para evitar conflitos entre dependências de projetos diferentes é possível criar ambientes virtuais para cada projeto:
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

# print a text with color green 
print("\033[92m Texto verde \033[0m")