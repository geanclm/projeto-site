#!/bin/sh

# Este script inicializa o container node(Nodejs)
# by geanclm on 17/11/2023

# echo " "
# echo "Iniciando o container mongoDB..."
# echo " "
sudo docker run -dit --rm --name gclm-node -p 8124:8124 -v /mnt/c/Users/geanc/OneDrive/Documentos/GitHub/projeto-site/estudos/:/usr/src/app -w /usr/src/app node:21-alpine3.18 node olamundo.js
# echo " "
# sudo docker container ls

# se precisar executar o container e acessar as pastas
# sudo docker exec -it gclm-node bash