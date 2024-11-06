texto = 'Hello, World!'
print(texto)

'criar uma função para gerar testar números se um número é primo'
def eh_primo(n):
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

print(eh_primo(11))