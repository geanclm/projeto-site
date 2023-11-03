#!/bin/sh

# Este script irá imprimir o diretório atual e listar os arquivos

NOME="Maria de Nazaré"

echo "Qual o seu nome?"
read nome
echo " "
echo "Olá, $nome!"
echo " "
echo "Segue a saída dos comandos pwd e ls"
echo " "
pwd
ls
echo " "
echo ${NOME}
echo " "
echo $0
echo " "
