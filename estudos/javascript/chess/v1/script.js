document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    let selectedPiece = null;
    let selectedSquare = null;
    const pieces = [
        '<span class="piece">♖</span>', '<span class="piece">♘</span>', '<span class="piece">♗</span>', '<span class="piece">♕</span>', '<span class="piece">♔</span>', '<span class="piece">♗</span>', '<span class="piece">♘</span>', '<span class="piece">♖</span>',
        '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>', '<span class="piece">♙</span>',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>', '<span class="piece">♟</span>',
        '<span class="piece">♜</span>', '<span class="piece">♞</span>', '<span class="piece">♝</span>', '<span class="piece">♛</span>', '<span class="piece">♚</span>', '<span class="piece">♝</span>', '<span class="piece">♞</span>', '<span class="piece">♜</span>'
    ];

    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((i + Math.floor(i / 8)) % 2 === 0 ? 'white' : 'black');
        square.dataset.index = i;

        square.addEventListener('click', () => {
            handleSquareClick(square);
        });

        square.innerHTML = pieces[i];
        board.appendChild(square);
    }

    function handleSquareClick(square) {
        const currentIndex = parseInt(square.dataset.index);

        if (!selectedPiece && pieces[currentIndex]) {
            selectPiece(square);
        } else if (selectedPiece && selectedSquare !== square) {
            const targetIndex = parseInt(square.dataset.index);

            if (isValidMove(selectedSquare, square)) {
                movePiece(selectedSquare, square);
            }

            clearSelection();
        }
    }

    function selectPiece(square) {
        selectedPiece = square.innerHTML;
        selectedSquare = square;
        square.classList.add('selected');
    }

    function isValidMove(startSquare, targetSquare) {
        const startIndex = parseInt(startSquare.dataset.index);
        const targetIndex = parseInt(targetSquare.dataset.index);

        // Aqui você pode implementar a lógica de validação de movimento para cada tipo de peça
        // Esta é uma implementação simplificada e permite qualquer movimento neste exemplo básico
        return true;
    }

    function movePiece(startSquare, targetSquare) {
        const startIndex = parseInt(startSquare.dataset.index);
        const targetIndex = parseInt(targetSquare.dataset.index);

        pieces[targetIndex] = selectedPiece;
        pieces[startIndex] = '';
        targetSquare.innerHTML = selectedPiece;
        startSquare.innerHTML = '';
    }

    function clearSelection() {
        selectedPiece = null;
        selectedSquare.classList.remove('selected');
    }
});