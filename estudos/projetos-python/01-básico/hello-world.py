# criar uma função para gerar testar números se um número é primo
# def eh_primo(n):
#     for i in range(2, n):
#         if n % i == 0:
#             return False
#     return True
# print(eh_primo(11))

import math

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
print(texto)
print(eh_primo(11))B