#!/bin/sh

# Este script inicializa o container xginx
# by geanclm on 03/11/2023 

echo " "
echo "Iniciando o container mongoDB..."
echo " "
sudo docker run -dit --rm --name gclm-nginx -p 8080:80 -v /var/www/html:/usr/share/nginx/html:ro nginx:alpine3.18-slim
echo " "
sudo docker container ls
