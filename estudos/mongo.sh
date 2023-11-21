#!/bin/sh

# Este script inicializa o container mongoDB
# by geanclm on 03/11/2023 13:45h

echo " "
echo "Iniciando o container mongoDB..."
echo " "
sudo docker run -d --rm -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=s145 -p 27017:27017 --name gclm-mongo mongo
# echo " "
# sudo docker container ls

# se precisar executar o container e acessar as pastas
# sudo docker exec -it gclm-mongo mongosh -u admin -p s145
