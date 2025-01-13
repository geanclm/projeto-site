# Importa o módulo Streamlit
import streamlit as st

# Título da página
st.title("Exemplo de Aplicação Simples com Streamlit")

# Cabeçalho na página
st.header("Saudação Personalizada")

# Função para exibir a saudação com o nome do usuário
def saudacao(nome):
    return f"Olá, {nome}! Bem-vindo à aplicação em Streamlit."

# Caixa de texto para o usuário inserir seu nome
nome_usuario = st.text_input("Digite seu nome:")

# Botão para gerar a saudação
if st.button("Saudar"):
    # Exibe a saudação na página
    st.write(saudacao(nome_usuario))

# Cabeçalho para exibir um gráfico simples
st.header("Gráfico de Exemplo")

# Importa o módulo numpy para criar dados para o gráfico
import numpy as np

# Gera dados aleatórios para o gráfico
dados = np.random.randn(100)

# Cria um gráfico de linha simples
st.line_chart(dados)