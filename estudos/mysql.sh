#!/bin/sh
# Este script inicializa o container mysql
# by geanclm on 03/11/2023

echo " "
echo "Iniciando o container mysql..."
echo " "
sudo docker run --name gclm-mysql -v "volume-mysql:/var/lib/mysql" -p 3306:3306 -e MYSQL_ROOT_PASSWORD=s145 -d --rm mysql
# echo " "
# sudo docker container ls



# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# PASSO A PASSO PARA ACESSAR O BANCO DE DADOS MYSQL
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

# 1 - se precisar executar o container e acessar as pastas
# sudo docker exec -it gclm-mysql bash

# 2 - conta de root do MySQL
# bash-4.4# mysql -uroot -ps145
