#!/bin/bash

# Este script inicializa o container apache-php
# by geanclm on 03/11/2023 

# para testar um servidor http diretamente no linux sem apache e sem nginx
# rodar na pasta onde está localizado o arquivo index.html
#  python3 -m http.server 8080


echo " "
echo "Iniciando o container apache-php..."
echo " "
sudo docker run --rm -dit --name gclm-http -p 8080:80 -v /mnt/c/Users/geanc/OneDrive/Documentos/GitHub/projeto-site/estudos:/var/www/html gclm-apache-php

# echo " "
# sudo docker container ls

# se precisar executar o container e acessar as pastas
# sudo docker exec -it gclm-http bash
