#!/bin/bash

# Este script inicializa o container getting-started
# by geanclm on 03/11/2023 

echo " "
echo "Iniciando o container getting-started..."
echo " "
sudo docker run --rm -d -p 3000:3000 getting-started

echo " "
sudo docker container ls
