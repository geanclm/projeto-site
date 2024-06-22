# ler arquivos da pasta e mesclar em um único arquivo final .txt
# by geanclm on 21/06/2024

import os

# Pasta onde estão os arquivos .txt
pasta = r'C:\Users\geanc\Downloads\txt'

# Nome do arquivo de saída
arquivo_saida = r'C:\Users\geanc\Downloads\txt\prompt.txt'

# Lista para armazenar o conteúdo dos arquivos
conteudo_arquivos = []

# Percorre todos os arquivos .txt na pastaBBBB
for nome_arquivo in os.listdir(pasta):
    if nome_arquivo.endswith('.txt'):
        caminho_arquivo = os.path.join(pasta, nome_arquivo)
        with open(caminho_arquivo, 'r', encoding='utf-8') as arquivo:
            conteudo_arquivos.append(arquivo.read())

# Mescla o conteúdo dos arquivos
conteudo_mesclado = '\n\n\n'.join(conteudo_arquivos)

# Escreve o conteúdo mesclado no novo arquivo
with open(arquivo_saida, 'w', encoding='utf-8') as arquivo_saida:
    arquivo_saida.write(conteudo_mesclado)

print(f"Arquivos mesclados com sucesso! Resultado salvo em {arquivo_saida}")