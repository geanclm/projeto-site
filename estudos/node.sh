#!/bin/sh

# Este script inicializa o container node(Nodejs)
# by geanclm on 17/11/2023

# echo " "
# echo "Iniciando o container mongoDB..."
# echo " "

PORTA_HOST=8124
PORTA_CONTAINER=8124

sudo docker run -dit --rm --name gclm-node -p "$PORTA_HOST":"$PORTA_CONTAINER" -v /mnt/c/Users/geanc/OneDrive/Documentos/GitHub/projeto-site/estudos/:/usr/src/app -w /usr/src/app node:21-alpine3.18

# echo " "
# sudo docker container ls

# testar o o container com os arquivos javascript
# sudo docker exec -it gclm-node node index.js
# sudo docker exec -it gclm-node node olaMundo.js
# sudo docker exec -it gclm-node node helloWorld.js

# inicializa servidor http para teste - por padrão a porta é 8080 e precisa mudar as variaveis
# sudo docker exec -it gclm-node npx http-server -c-1