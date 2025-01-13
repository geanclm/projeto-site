# criar uma função para gerar testar números se um número é primo
# def eh_primo(n):
#     for i in range(2, n):
#         if n % i == 0:
#             return False
#     return True
# print(eh_primo(11))

import math
import datetime

def eh_primo(n):
    if n == 2:
        return True
    if n < 2 or n % 2 == 0:
        return False
    for i in range(3, int(math.sqrt(n)) + 1, 2):
        if n % i == 0:
            return False
    return True

texto = 'Hello, World!'
datahora = datetime.datetime.now()
print(texto)
print(datahora)
print(eh_primo(11))


# Arredondar os segundos
segundo_arredondado = (datahora.second + 1) if datahora.microsecond >= 500000 else datahora.second
datahora_arredondada = datahora.replace(second=segundo_arredondado, microsecond=0)

print(datahora_arredondada)