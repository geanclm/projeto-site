# Estudos com a biblioteca Selenium
# by geanclm on 8/11/2024

# documentation = "https://selenium-python.readthedocs.io/"	

# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# pip install selenium
from selenium import webdriver
import time

# url = 'https://www.python.org"
url ='https://loterias.caixa.gov.br/Paginas/Loteca.aspx'

navegador = webdriver.Edge()
navegador.get(url)
navegador.maximize_window()

# Localizando o elemento <a> dentro do <p class="description">
navegador.find_element('xpath', '//p[@class="description"]/a').click()

time.sleep(10)
navegador.quit()