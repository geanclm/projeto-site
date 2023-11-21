#!/bin/sh

# Este script inicializa o container xginx
# by geanclm on 03/11/2023 

echo " "
echo "Iniciando o container mongoDB..."
echo " "
#sudo docker run -dit --rm --name gclm-nginx -p 8080:80 nginx:alpine3.18-slim
sudo docker run -dit --rm --name gclm-nginx -p 8080:80 -v /mnt/c/Users/geanc/OneDrive/Documentos/GitHub/projeto-site/estudos:/usr/share/nginx/html:ro nginx:alpine3.18-slim
# echo " "
# sudo docker container ls

# se precisar executar o container e acessar as pastas
# sudo docker exec -it gclm-nginx sh
