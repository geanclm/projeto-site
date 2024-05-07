// Array inicial
let myArray = ['Maçã', 'Banana', 'Laranja', 'Morango', 'Abacaxi'];

// Função para adicionar e remover elementos do array
function addAndRemoveElements() {
    // Adiciona um elemento ao array no índice 2 (posição 3)
    myArray.splice(2, 0, 'Pera'); // Insere 'Pera' na posição 2

    // Remove um elemento do array no índice 4 (posição 5)
    myArray.splice(4, 1); // Remove o elemento na posição 4 (Abacaxi)

    // Exibe o array atualizado no console
    console.log(myArray);

    // Atualiza o conteúdo na página HTML
    displayArray();
}

// Função para exibir o array na página HTML
function displayArray() {
    const arrayOutput = document.getElementById('arrayOutput');
    arrayOutput.textContent = 'Array: ' + myArray.join(', ');
}
