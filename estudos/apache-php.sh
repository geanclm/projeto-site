#!/bin/bash

# Este script inicializa o container apache-php
# by geanclm on 03/11/2023 

echo " "
echo "Iniciando o container apache-php..."
echo " "
sudo docker run --rm -dit --name gclm-http -p 8080:80 -v /var/www/html:/var/www/html gclm-apache-php
echo " "
sudo docker container ls
