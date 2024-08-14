document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    let selectedPiece = null;
    let selectedSquare = null;
    const moveSound = new Audio('move.mp3');
    const captureSound = new Audio('capture.mp3');
    
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
                clearSelection();
            } else {
                clearSelection();
            }
        }
    }

    function selectPiece(square) {
        selectedPiece = square.innerHTML;
        selectedSquare = square;
        square.classList.add('selected');

        const possibleMoves = getPossibleMoves(square);
        possibleMoves.forEach(move => move.classList.add('highlight'));
    }

    function getPossibleMoves(square) {
        const possibleMoves = [];
        const currentIndex = parseInt(square.dataset.index);
        const piece = pieces[currentIndex].trim();
        const startRow = Math.floor(currentIndex / 8);
        const startCol = currentIndex % 8;

        // Exemplo simples de movimentos possíveis para um peão branco
        if (piece === '♙') {
            const targetIndex = currentIndex - 8;
            if (targetIndex >= 0 && !pieces[targetIndex]) {
                possibleMoves.push(document.querySelector(`div[data-index='${targetIndex}']`));
            }
        }
        // Adicione a lógica para outros tipos de peças aqui...

        return possibleMoves;
    }

    function isValidMove(startSquare, targetSquare) {
        const startIndex = parseInt(startSquare.dataset.index);
        const targetIndex = parseInt(targetSquare.dataset.index);
        const piece = pieces[startIndex].trim();

        const startRow = Math.floor(startIndex / 8);
        const startCol = startIndex % 8;
        const targetRow = Math.floor(targetIndex / 8);
        const targetCol = targetIndex % 8;

        switch (piece) {
            case '♙': // Peão branco
                return targetRow === startRow - 1 && targetCol === startCol && !pieces[targetIndex];
            case '♟': // Peão preto
                return targetRow === startRow + 1 && targetCol === startCol && !pieces[targetIndex];
            // Adicionar lógica para outras peças...
            default:
                return true;
        }
    }

    function movePiece(startSquare, targetSquare) {
        const startIndex = parseInt(startSquare.dataset.index);
        const targetIndex = parseInt(targetSquare.dataset.index);

        const capturedPiece = pieces[targetIndex];

        pieces[targetIndex] = selectedPiece;
        pieces[startIndex] = '';
        targetSquare.innerHTML = selectedPiece;
        startSquare.innerHTML = '';

        if (capturedPiece !== '') {
            captureSound.play();
        } else {
            moveSound.play();
        }
    }

    function clearSelection() {
        selectedPiece = null;
        document.querySelectorAll('.selected, .highlight').forEach(el => el.classList.remove('selected', 'highlight'));
    }
});