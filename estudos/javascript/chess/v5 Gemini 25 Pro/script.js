document.addEventListener('DOMContentLoaded', function() {
    const boardElement = document.getElementById('board');
    const capturedPiecesWhiteContainer = document.getElementById('captured-pieces-white').appendChild(document.createElement('div'));
    capturedPiecesWhiteContainer.classList.add('captured-piece-container'); // Container interno
    const capturedPiecesBlackContainer = document.getElementById('captured-pieces-black').appendChild(document.createElement('div'));
    capturedPiecesBlackContainer.classList.add('captured-piece-container'); // Container interno
    const toggleNotationButton = document.getElementById('toggle-notation');
    const datetimeElement = document.getElementById('datetime');
    const currentPlayerElement = document.getElementById('current-player');
    const boardContainer = document.querySelector('.board-container'); // Seleciona o container

    let squares = []; // Array para guardar as referências dos elementos das casas
    let boardState = []; // Array 1D representando o estado lógico do tabuleiro (peças)
    let selectedSquareIndex = null; // Índice da casa selecionada (-1 ou null se nenhuma)
    let currentPlayer = 'white'; // Começa com as brancas
    let showNotation = false;
    // Tente carregar os sons, use objetos vazios se falhar para evitar erros
    let moveSound, captureSound;
    try {
        moveSound = new Audio('move.mp3');
        captureSound = new Audio('capture.mp3');
    } catch (e) {
        console.warn("Não foi possível carregar os arquivos de som. Sons desativados.", e);
        moveSound = { play: () => {} }; // Objeto dummy que não faz nada
        captureSound = { play: () => {} }; // Objeto dummy que não faz nada
    }


    // --- Definição Inicial das Peças ---
    // Usando objetos para melhor clareza e extensibilidade
    // Unicode: White: ♔♕♖♗♘♙ | Black: ♚♛♜♝♞♟
    function getInitialPiece(index) {
        const pieceMap = {
            0: { type: 'rook', color: 'black', symbol: '♜' }, 1: { type: 'knight', color: 'black', symbol: '♞' },
            2: { type: 'bishop', color: 'black', symbol: '♝' }, 3: { type: 'queen', color: 'black', symbol: '♛' },
            4: { type: 'king', color: 'black', symbol: '♚' }, 5: { type: 'bishop', color: 'black', symbol: '♝' },
            6: { type: 'knight', color: 'black', symbol: '♞' }, 7: { type: 'rook', color: 'black', symbol: '♜' },
            8: { type: 'pawn', color: 'black', symbol: '♟' }, 9: { type: 'pawn', color: 'black', symbol: '♟' },
           10: { type: 'pawn', color: 'black', symbol: '♟' }, 11: { type: 'pawn', color: 'black', symbol: '♟' },
           12: { type: 'pawn', color: 'black', symbol: '♟' }, 13: { type: 'pawn', color: 'black', symbol: '♟' },
           14: { type: 'pawn', color: 'black', symbol: '♟' }, 15: { type: 'pawn', color: 'black', symbol: '♟' },

           48: { type: 'pawn', color: 'white', symbol: '♙' }, 49: { type: 'pawn', color: 'white', symbol: '♙' },
           50: { type: 'pawn', color: 'white', symbol: '♙' }, 51: { type: 'pawn', color: 'white', symbol: '♙' },
           52: { type: 'pawn', color: 'white', symbol: '♙' }, 53: { type: 'pawn', color: 'white', symbol: '♙' },
           54: { type: 'pawn', color: 'white', symbol: '♙' }, 55: { type: 'pawn', color: 'white', symbol: '♙' },
           56: { type: 'rook', color: 'white', symbol: '♖' }, 57: { type: 'knight', color: 'white', symbol: '♘' },
           58: { type: 'bishop', color: 'white', symbol: '♗' }, 59: { type: 'queen', color: 'white', symbol: '♕' },
           60: { type: 'king', color: 'white', symbol: '♔' }, 61: { type: 'bishop', color: 'white', symbol: '♗' },
           62: { type: 'knight', color: 'white', symbol: '♘' }, 63: { type: 'rook', color: 'white', symbol: '♖' },
        };
        return pieceMap[index] || null; // Retorna null para casas vazias
    }

    // --- Criação do Tabuleiro ---
    function createBoard() {
        boardElement.innerHTML = ''; // Limpa o tabuleiro antes de criar
        squares = [];
        boardState = [];

        for (let i = 0; i < 64; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + Math.floor(i / 8)) % 2 === 0 ? 'white' : 'black');
            square.dataset.index = i;

            const pieceData = getInitialPiece(i);
            boardState[i] = pieceData; // Adiciona ao estado lógico

            if (pieceData) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                //pieceElement.classList.add(pieceData.color === 'white' ? 'white-piece' : 'black-piece'); // Adiciona classe de cor
                pieceElement.textContent = pieceData.symbol;
                pieceElement.dataset.piece = pieceData.type;
                pieceElement.dataset.color = pieceData.color;
                square.appendChild(pieceElement);
            }

            square.addEventListener('click', () => handleSquareClick(i));
            boardElement.appendChild(square);
            squares.push(square); // Guarda a referência do elemento
            addNotation(square, i);
        }
        updateNotationVisibility(); // Aplica o estado inicial da notação
    }

    // --- Adiciona Notação Algébrica ---
    function addNotation(square, index) {
        const file = String.fromCharCode(97 + (index % 8)); // a-h
        const rank = 8 - Math.floor(index / 8); // 8-1

        // Adiciona notação de coluna (file) na primeira fileira (rank 1)
        if (Math.floor(index / 8) === 7) {
            const fileNotation = document.createElement('span');
            fileNotation.classList.add('notation', 'file-notation');
            fileNotation.textContent = file;
            square.appendChild(fileNotation);
        }

        // Adiciona notação de fileira (rank) na primeira coluna (file a)
        if (index % 8 === 0) {
            const rankNotation = document.createElement('span');
            rankNotation.classList.add('notation', 'rank-notation');
            rankNotation.textContent = rank;
            square.appendChild(rankNotation);
        }
    }

    // --- Manipulador de Clique na Casa ---
    function handleSquareClick(index) {
        clearHighlights(); // Limpa destaques anteriores

        const clickedPieceData = boardState[index];

        if (selectedSquareIndex === null) {
            // 1. Tentando selecionar uma peça
            if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                selectPiece(index);
            }
        } else {
            // 2. Tentando mover a peça selecionada
            const possibleMoves = getPossibleMoves(selectedSquareIndex);
            const isMoveValid = possibleMoves.some(move => move.to === index);

            if (isMoveValid) {
                 // É um movimento válido (inclui captura)
                movePiece(selectedSquareIndex, index);
                deselectPiece();
                switchPlayer();
            } else if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                // 3. Clicou em outra peça da mesma cor: seleciona a nova peça
                deselectPiece(); // Desseleciona a antiga
                selectPiece(index); // Seleciona a nova
            } else {
                // 4. Clicou em uma casa inválida ou peça adversária sem ser captura válida
                deselectPiece();
            }
        }
    }

    // --- Seleciona uma Peça ---
    function selectPiece(index) {
        selectedSquareIndex = index;
        squares[index].classList.add('selected');
        highlightPossibleMoves(index);
    }

    // --- Desseleciona a Peça ---
    function deselectPiece() {
        if (selectedSquareIndex !== null) {
            squares[selectedSquareIndex].classList.remove('selected');
        }
        selectedSquareIndex = null;
        clearHighlights();
    }

    // --- Limpa Destaques de Movimento ---
    function clearHighlights() {
        squares.forEach(sq => sq.classList.remove('highlight', 'capture-possible'));
    }

    // --- Destaca Movimentos Possíveis ---
    function highlightPossibleMoves(index) {
        const moves = getPossibleMoves(index);
        moves.forEach(move => {
            squares[move.to].classList.add('highlight');
             if(move.isCapture) {
                 squares[move.to].classList.add('capture-possible');
             }
        });
    }

    // --- Calcula Movimentos Possíveis (Função Principal) ---
    function getPossibleMoves(startIndex) {
        const pieceData = boardState[startIndex];
        if (!pieceData) return [];

        switch (pieceData.type) {
            case 'pawn': return getPawnMoves(startIndex, pieceData.color);
            case 'rook': return getRookMoves(startIndex, pieceData.color);
            case 'knight': return getKnightMoves(startIndex, pieceData.color);
            case 'bishop': return getBishopMoves(startIndex, pieceData.color);
            case 'queen': return getQueenMoves(startIndex, pieceData.color);
            case 'king': return getKingMoves(startIndex, pieceData.color);
            default: return [];
        }
        // Futuro: Adicionar verificação de xeque aqui. Um movimento só é válido
        // se não deixar o próprio rei em xeque.
    }

    // --- Funções Auxiliares de Cálculo de Movimento ---

    // Converte índice (0-63) para coordenadas [linha, coluna] (0-7)
    function indexToCoords(index) {
        return [Math.floor(index / 8), index % 8];
    }

    // Converte coordenadas [linha, coluna] para índice
    function coordsToIndex(row, col) {
        return row * 8 + col;
    }

    // Verifica se as coordenadas estão dentro do tabuleiro
    function isWithinBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // --- Lógica de Movimento por Peça ---

    function getPawnMoves(startIndex, color) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        const direction = color === 'white' ? -1 : 1; // Peão branco sobe (-1), preto desce (+1)
        const startRank = color === 'white' ? 6 : 1; // Fileira inicial para movimento duplo

        // 1. Movimento simples para frente
        const oneStepIndex = coordsToIndex(startRow + direction, startCol);
        if (isWithinBoard(startRow + direction, startCol) && !boardState[oneStepIndex]) {
            moves.push({ from: startIndex, to: oneStepIndex, isCapture: false });

            // 2. Movimento duplo (apenas do início e se o primeiro passo está livre)
            if (startRow === startRank) {
                const twoStepsIndex = coordsToIndex(startRow + 2 * direction, startCol);
                if (isWithinBoard(startRow + 2 * direction, startCol) && !boardState[twoStepsIndex]) {
                    moves.push({ from: startIndex, to: twoStepsIndex, isCapture: false });
                }
            }
        }

        // 3. Capturas diagonais
        const captureOffsets = [-1, 1];
        captureOffsets.forEach(offset => {
            const captureCol = startCol + offset;
            const captureRow = startRow + direction;
            if (isWithinBoard(captureRow, captureCol)) {
                const captureIndex = coordsToIndex(captureRow, captureCol);
                const targetPiece = boardState[captureIndex];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ from: startIndex, to: captureIndex, isCapture: true });
                }
                // Futuro: Adicionar lógica de captura "en passant" aqui
            }
        });

        // Futuro: Adicionar lógica de promoção do peão aqui

        return moves;
    }

    function getRookMoves(startIndex, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Cima, Baixo, Esquerda, Direita
        const [startRow, startCol] = indexToCoords(startIndex);

        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; ; i++) {
                const currentRow = startRow + i * dRow;
                const currentCol = startCol + i * dCol;

                if (!isWithinBoard(currentRow, currentCol)) break; // Saiu do tabuleiro

                const targetIndex = coordsToIndex(currentRow, currentCol);
                const targetPiece = boardState[targetIndex];

                if (targetPiece) {
                    if (targetPiece.color !== color) {
                        moves.push({ from: startIndex, to: targetIndex, isCapture: true }); // Captura
                    }
                    break; // Bloqueado por peça (amiga ou inimiga)
                } else {
                    moves.push({ from: startIndex, to: targetIndex, isCapture: false }); // Movimento livre
                }
            }
        });
        return moves;
    }

    function getKnightMoves(startIndex, color) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        // Todos os 8 movimentos possíveis em L do cavalo
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        offsets.forEach(([dRow, dCol]) => {
            const targetRow = startRow + dRow;
            const targetCol = startCol + dCol;

            if (isWithinBoard(targetRow, targetCol)) {
                const targetIndex = coordsToIndex(targetRow, targetCol);
                const targetPiece = boardState[targetIndex];
                if (!targetPiece || targetPiece.color !== color) { // Casa vazia ou peça inimiga
                     moves.push({ from: startIndex, to: targetIndex, isCapture: !!targetPiece });
                }
            }
        });
        return moves;
    }

    function getBishopMoves(startIndex, color) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonais
        const [startRow, startCol] = indexToCoords(startIndex);

        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; ; i++) {
                const currentRow = startRow + i * dRow;
                const currentCol = startCol + i * dCol;

                if (!isWithinBoard(currentRow, currentCol)) break;

                const targetIndex = coordsToIndex(currentRow, currentCol);
                const targetPiece = boardState[targetIndex];

                if (targetPiece) {
                    if (targetPiece.color !== color) {
                        moves.push({ from: startIndex, to: targetIndex, isCapture: true });
                    }
                    break;
                } else {
                    moves.push({ from: startIndex, to: targetIndex, isCapture: false });
                }
            }
        });
        return moves;
    }

    function getQueenMoves(startIndex, color) {
        // Rainha = Movimentos da Torre + Movimentos do Bispo
        return [
            ...getRookMoves(startIndex, color),
            ...getBishopMoves(startIndex, color)
        ];
    }

    function getKingMoves(startIndex, color) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        // Movimentos em todas as 8 direções adjacentes
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], /*[0,0]*/ [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        offsets.forEach(([dRow, dCol]) => {
            const targetRow = startRow + dRow;
            const targetCol = startCol + dCol;

            if (isWithinBoard(targetRow, targetCol)) {
                const targetIndex = coordsToIndex(targetRow, targetCol);
                const targetPiece = boardState[targetIndex];

                 // Futuro: Precisa verificar se a casa destino está sob ataque (xeque)
                 // const isTargetSquareSafe = !isSquareAttacked(targetIndex, opponentColor);

                if (!targetPiece || targetPiece.color !== color /*&& isTargetSquareSafe*/) {
                     moves.push({ from: startIndex, to: targetIndex, isCapture: !!targetPiece });
                }
            }
        });

        // Futuro: Adicionar lógica de Roque (castling) aqui
        // Precisa verificar:
        // 1. Rei e Torre não se moveram.
        // 2. Casas entre eles estão vazias.
        // 3. Rei não está em xeque.
        // 4. Casas por onde o rei passa não estão sob ataque.

        return moves;
    }


    // --- Move a Peça (Atualiza Estado e DOM) ---
    function movePiece(fromIndex, toIndex) {
        const pieceData = boardState[fromIndex];
        const targetPieceData = boardState[toIndex]; // Peça capturada (pode ser null)

        // 1. Atualiza o estado lógico (boardState)
        if (targetPieceData) {
            addCapturedPiece(targetPieceData); // Adiciona à lista de capturadas
            captureSound.play();
        } else {
            moveSound.play();
        }
        boardState[toIndex] = pieceData;
        boardState[fromIndex] = null;

        // 2. Atualiza o DOM (visual)
        const movingPieceElement = squares[fromIndex].querySelector('.piece');
        const targetSquareElement = squares[toIndex];

        // Remove peça existente (se houver captura) do DOM
        const existingPieceElement = targetSquareElement.querySelector('.piece');
        if (existingPieceElement) {
            targetSquareElement.removeChild(existingPieceElement);
        }

        // Move a peça no DOM
        if (movingPieceElement) {
            targetSquareElement.appendChild(movingPieceElement);
        } else {
             console.error("Erro: Tentando mover peça que não existe no DOM", fromIndex, pieceData);
        }

        // Futuro: Lógica de promoção do peão
        // if (pieceData.type === 'pawn' && (toRow === 0 || toRow === 7)) {
        //    promotePawn(toIndex);
        // }
    }

    // --- Adiciona Peça Capturada à Área Lateral ---
    function addCapturedPiece(pieceData) {
        const capturedPieceElement = document.createElement('span');
        capturedPieceElement.classList.add('captured-piece');
        capturedPieceElement.textContent = pieceData.symbol;
        //capturedPieceElement.classList.add(pieceData.color === 'white' ? 'white-piece' : 'black-piece');

        if (pieceData.color === 'white') {
            // Peça branca foi capturada, vai para a área das pretas
            capturedPiecesBlackContainer.appendChild(capturedPieceElement);
        } else {
            // Peça preta foi capturada, vai para a área das brancas
            capturedPiecesWhiteContainer.appendChild(capturedPieceElement);
        }
    }

    // --- Troca o Jogador Atual ---
    function switchPlayer() {
        currentPlayer = (currentPlayer === 'white' ? 'black' : 'white');
        currentPlayerElement.textContent = (currentPlayer === 'white' ? 'Brancas' : 'Pretas');
        // Futuro: Verificar Xeque/Xeque-mate aqui
        // if (isInCheck(currentPlayer)) {
        //    if (isCheckmate(currentPlayer)) {
        //        endGame(currentPlayer === 'white' ? 'Pretas' : 'Brancas'); // O outro jogador vence
        //    } else {
        //        // Marcar que o jogador está em xeque
        //    }
        // } else if (isStalemate(currentPlayer)) {
        //      endGame('Empate'); // Afogamento
        // }
    }

    // --- Alterna Visibilidade da Notação ---
    function toggleNotation() {
        showNotation = !showNotation;
        updateNotationVisibility();
    }
    function updateNotationVisibility() {
         if (showNotation) {
            boardContainer.classList.add('show-notation');
         } else {
            boardContainer.classList.remove('show-notation');
         }
    }


    // --- Atualiza Data e Hora ---
    function updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        datetimeElement.textContent = now.toLocaleDateString('pt-BR', options);
    }

    // --- Inicialização ---
    function initGame() {
        createBoard();
        currentPlayer = 'white';
        currentPlayerElement.textContent = 'Brancas';
        selectedSquareIndex = null;
        capturedPiecesWhiteContainer.innerHTML = ''; // Limpa capturadas
        capturedPiecesBlackContainer.innerHTML = ''; // Limpa capturadas
        updateDateTime();
        setInterval(updateDateTime, 1000);
        toggleNotationButton.addEventListener('click', toggleNotation);
         // Futuro: Adicionar listener para botão de reiniciar
        // resetButton.addEventListener('click', initGame);
    }

    initGame(); // Inicia o jogo!

});