document.addEventListener('DOMContentLoaded', function() {
    const boardElement = document.getElementById('board');
    const capturedPiecesWhiteParent = document.getElementById('captured-pieces-white');
    const capturedPiecesBlackParent = document.getElementById('captured-pieces-black');
    let capturedPiecesWhiteContainer, capturedPiecesBlackContainer; // Serão os containers internos
    
    const toggleNotationButton = document.getElementById('toggle-notation');
    const datetimeElement = document.getElementById('datetime');
    const gameInfoElement = document.querySelector('.game-info p'); // O <p> que contém o span
    const currentPlayerSpan = document.getElementById('current-player-text'); // O <span> específico
    const boardContainer = document.querySelector('.board-container');
    const controlsElement = document.querySelector('.controls');

    let squares = [];
    let boardState = [];
    let selectedSquareIndex = null;
    let currentPlayer = 'white';
    let showNotation = false;
    let gameEnded = false;
    let lastMove = { from: null, to: null };
    let datetimeInterval;

    let moveSound, captureSound;
    try {
        moveSound = new Audio('move.mp3'); // Certifique-se que 'move.mp3' existe
        captureSound = new Audio('capture.mp3'); // Certifique-se que 'capture.mp3' existe
    } catch (e) {
        console.warn("Não foi possível carregar os arquivos de som. Sons desativados.", e);
        moveSound = { play: () => {} };
        captureSound = { play: () => {} };
    }

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
        return pieceMap[index] || null;
    }

    function createCapturedPiecesContainers() {
        // Limpa H4s e containers antigos antes de adicionar novos
        capturedPiecesWhiteParent.innerHTML = '<h4>Capturadas (Brancas):</h4>';
        capturedPiecesBlackParent.innerHTML = '<h4>Capturadas (Pretas):</h4>';

        capturedPiecesWhiteContainer = document.createElement('div');
        capturedPiecesWhiteContainer.classList.add('captured-piece-container');
        capturedPiecesWhiteParent.appendChild(capturedPiecesWhiteContainer);

        capturedPiecesBlackContainer = document.createElement('div');
        capturedPiecesBlackContainer.classList.add('captured-piece-container');
        capturedPiecesBlackParent.appendChild(capturedPiecesBlackContainer);
    }

    function createBoard() {
        boardElement.innerHTML = '';
        squares = [];
        boardState = [];

        for (let i = 0; i < 64; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + Math.floor(i / 8)) % 2 === 0 ? 'white' : 'black');
            square.dataset.index = i;

            const pieceData = getInitialPiece(i);
            boardState[i] = pieceData;

            if (pieceData) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                pieceElement.textContent = pieceData.symbol;
                pieceElement.dataset.piece = pieceData.type;
                pieceElement.dataset.color = pieceData.color;
                square.appendChild(pieceElement);
            }

            square.addEventListener('click', () => handleSquareClick(i));
            boardElement.appendChild(square);
            squares.push(square);
            addNotation(square, i);
        }
        updateNotationVisibility();
    }

    function addNotation(square, index) {
        const file = String.fromCharCode(97 + (index % 8));
        const rank = 8 - Math.floor(index / 8);

        if (Math.floor(index / 8) === 7) {
            const fileNotation = document.createElement('span');
            fileNotation.classList.add('notation', 'file-notation');
            fileNotation.textContent = file;
            square.appendChild(fileNotation);
        }
        if (index % 8 === 0) {
            const rankNotation = document.createElement('span');
            rankNotation.classList.add('notation', 'rank-notation');
            rankNotation.textContent = rank;
            square.appendChild(rankNotation);
        }
    }

    function handleSquareClick(index) {
        if (gameEnded) return; // Não faz nada se o jogo terminou

        const clickedSquareElement = squares[index];
        const clickedPieceData = boardState[index];

        if (selectedSquareIndex === null) {
            if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                selectPiece(index);
            }
        } else {
            const possibleMoves = getPossibleMoves(selectedSquareIndex);
            const isValidMoveTarget = possibleMoves.some(move => move.to === index);

            if (isValidMoveTarget) {
                movePiece(selectedSquareIndex, index);
                // Deseleção e troca de jogador acontecem em movePiece ou após ela,
                // exceto se o jogo terminar.
                if (!gameEnded) {
                    deselectPiece();
                    switchPlayer();
                }
            } else if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                deselectPiece();
                selectPiece(index);
            } else {
                deselectPiece();
            }
        }
    }

    function selectPiece(index) {
        if (selectedSquareIndex !== null) {
            squares[selectedSquareIndex].classList.remove('selected');
        }
        selectedSquareIndex = index;
        squares[index].classList.add('selected');
        highlightPossibleMoves(index);
    }

    function deselectPiece() {
        if (selectedSquareIndex !== null) {
            squares[selectedSquareIndex].classList.remove('selected');
        }
        selectedSquareIndex = null;
        clearHighlights();
    }

    function clearHighlights() {
        squares.forEach(sq => sq.classList.remove('highlight', 'capture-possible'));
    }
    
    function clearLastMoveHighlight() {
        if (lastMove.from !== null && squares[lastMove.from]) squares[lastMove.from].classList.remove('last-move-from');
        if (lastMove.to !== null && squares[lastMove.to]) squares[lastMove.to].classList.remove('last-move-to');
    }

    function highlightPossibleMoves(startIndex) {
        clearHighlights();
        const moves = getPossibleMoves(startIndex);
        moves.forEach(move => {
            squares[move.to].classList.add('highlight');
            if (move.isCapture) {
                squares[move.to].classList.add('capture-possible');
            }
        });
    }

    function indexToCoords(index) { return [Math.floor(index / 8), index % 8]; }
    function coordsToIndex(row, col) { return row * 8 + col; }
    function isWithinBoard(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }

    function getPawnMoves(startIndex, color) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        const direction = color === 'white' ? -1 : 1;
        const startRank = color === 'white' ? 6 : 1;

        const oneStepIndex = coordsToIndex(startRow + direction, startCol);
        if (isWithinBoard(startRow + direction, startCol) && !boardState[oneStepIndex]) {
            moves.push({ from: startIndex, to: oneStepIndex, isCapture: false });
            if (startRow === startRank) {
                const twoStepsIndex = coordsToIndex(startRow + 2 * direction, startCol);
                if (isWithinBoard(startRow + 2 * direction, startCol) && !boardState[twoStepsIndex]) {
                    moves.push({ from: startIndex, to: twoStepsIndex, isCapture: false });
                }
            }
        }
        [-1, 1].forEach(offset => {
            const captureCol = startCol + offset;
            const captureRow = startRow + direction;
            if (isWithinBoard(captureRow, captureCol)) {
                const captureIndex = coordsToIndex(captureRow, captureCol);
                const targetPiece = boardState[captureIndex];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ from: startIndex, to: captureIndex, isCapture: true });
                }
            }
        });
        return moves;
    }
    function getRookMoves(startIndex, color) {
        const moves = []; const directions = [[-1,0],[1,0],[0,-1],[0,1]]; const [r,c] = indexToCoords(startIndex);
        directions.forEach(([dr,dc]) => {
            for(let i=1;;i++){ const cr=r+i*dr; const cc=c+i*dc; if(!isWithinBoard(cr,cc))break;
            const ti=coordsToIndex(cr,cc); const tp=boardState[ti];
            if(tp){if(tp.color!==color)moves.push({from:startIndex,to:ti,isCapture:true});break;}
            else moves.push({from:startIndex,to:ti,isCapture:false});}
        }); return moves;
    }
    function getKnightMoves(startIndex, color) {
        const moves = []; const [r,c] = indexToCoords(startIndex);
        const o=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        o.forEach(([dr,dc])=>{ const tr=r+dr; const tc=c+dc; if(isWithinBoard(tr,tc)){
            const ti=coordsToIndex(tr,tc); const tp=boardState[ti];
            if(!tp||tp.color!==color)moves.push({from:startIndex,to:ti,isCapture:!!tp});}
        }); return moves;
    }
    function getBishopMoves(startIndex, color) {
        const moves = []; const directions = [[-1,-1],[-1,1],[1,-1],[1,1]]; const [r,c] = indexToCoords(startIndex);
        directions.forEach(([dr,dc]) => {
            for(let i=1;;i++){ const cr=r+i*dr; const cc=c+i*dc; if(!isWithinBoard(cr,cc))break;
            const ti=coordsToIndex(cr,cc); const tp=boardState[ti];
            if(tp){if(tp.color!==color)moves.push({from:startIndex,to:ti,isCapture:true});break;}
            else moves.push({from:startIndex,to:ti,isCapture:false});}
        }); return moves;
    }
    function getQueenMoves(startIndex, color) { return [...getRookMoves(startIndex,color), ...getBishopMoves(startIndex,color)]; }
    function getKingMoves(startIndex, color) {
        const moves = []; const [r,c] = indexToCoords(startIndex);
        const o=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        o.forEach(([dr,dc])=>{ const tr=r+dr; const tc=c+dc; if(isWithinBoard(tr,tc)){
            const ti=coordsToIndex(tr,tc); const tp=boardState[ti];
            if(!tp||tp.color!==color)moves.push({from:startIndex,to:ti,isCapture:!!tp});}
        }); return moves;
    }
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
    }

    function movePiece(fromIndex, toIndex) {
        const pieceData = boardState[fromIndex];
        const targetPieceData = boardState[toIndex];

        clearLastMoveHighlight();

        if (targetPieceData) {
            addCapturedPiece(targetPieceData);
            captureSound.play();
            if (targetPieceData.type === 'king') {
                endGame(pieceData.color); // O jogador que capturou o rei vence
                // Adicionar classe ao rei capturado para destaque, se desejado
                if (squares[toIndex].querySelector('.piece')) {
                     squares[toIndex].querySelector('.piece').classList.add('king-in-check'); // Reutilizar estilo
                }
            }
        } else {
            moveSound.play();
        }

        boardState[toIndex] = pieceData;
        boardState[fromIndex] = null;

        const movingPieceElement = squares[fromIndex].querySelector('.piece');
        const targetSquareElement = squares[toIndex];
        const existingPieceElement = targetSquareElement.querySelector('.piece');
        if (existingPieceElement) {
            targetSquareElement.removeChild(existingPieceElement);
        }
        if (movingPieceElement) {
            targetSquareElement.appendChild(movingPieceElement);
        }

        // Destaque da última jogada
        squares[fromIndex].classList.add('last-move-from');
        squares[toIndex].classList.add('last-move-to');
        lastMove = { from: fromIndex, to: toIndex };

        // Promoção de Peão
        if (!gameEnded && pieceData.type === 'pawn') {
            const [endRow] = indexToCoords(toIndex);
            if ((pieceData.color === 'white' && endRow === 0) || (pieceData.color === 'black' && endRow === 7)) {
                promotePawn(toIndex, pieceData.color);
            }
        }
        
        if (gameEnded) { // Se o jogo terminou por captura do rei
            deselectPiece(); // Limpa seleção final
        }
    }

    function promotePawn(pawnIndex, color) {
        let newPieceType = '';
        // Loop simples para garantir uma escolha válida (ou padrão 'Q')
        while (true) {
            newPieceType = prompt(`Peão promovido! Escolha a nova peça (Q para Rainha, R para Torre, B para Bispo, N para Cavalo):`, 'Q');
            if (newPieceType === null) { // Usuário pressionou Cancelar
                newPieceType = 'Q'; // Padrão para Rainha
                break;
            }
            newPieceType = newPieceType.trim().toUpperCase();
            if (['Q', 'R', 'B', 'N'].includes(newPieceType)) {
                break;
            }
            alert("Escolha inválida. Por favor, digite Q, R, B ou N.");
        }

        let newPieceSymbol = '';
        let promotedPieceType = '';
        switch (newPieceType) {
            case 'R': promotedPieceType = 'rook'; newPieceSymbol = (color === 'white' ? '♖' : '♜'); break;
            case 'B': promotedPieceType = 'bishop'; newPieceSymbol = (color === 'white' ? '♗' : '♝'); break;
            case 'N': promotedPieceType = 'knight'; newPieceSymbol = (color === 'white' ? '♘' : '♞'); break;
            case 'Q': // Padrão para Rainha (ou se Q for escolhido)
            default:  promotedPieceType = 'queen'; newPieceSymbol = (color === 'white' ? '♕' : '♛');
        }

        boardState[pawnIndex] = { type: promotedPieceType, color: color, symbol: newPieceSymbol };
        const pieceElement = squares[pawnIndex].querySelector('.piece');
        if(pieceElement) {
            pieceElement.textContent = newPieceSymbol;
            pieceElement.dataset.piece = promotedPieceType;
        }
    }

    function addCapturedPiece(pieceData) {
        const capturedPieceElement = document.createElement('span');
        capturedPieceElement.classList.add('captured-piece');
        capturedPieceElement.textContent = pieceData.symbol;

        if (pieceData.color === 'white') {
            capturedPiecesBlackContainer.appendChild(capturedPieceElement);
        } else {
            capturedPiecesWhiteContainer.appendChild(capturedPieceElement);
        }
    }

    function switchPlayer() {
        currentPlayer = (currentPlayer === 'white' ? 'black' : 'white');
        currentPlayerSpan.textContent = (currentPlayer === 'white' ? 'Brancas' : 'Pretas');
    }

    function endGame(winningColor) {
        gameEnded = true;
        deselectPiece(); // Limpa qualquer seleção ou destaque de movimento
        clearHighlights();

        // Impede novos cliques no tabuleiro (recriando os quadrados sem listeners)
        // squares.forEach(square => {
        //    const clone = square.cloneNode(true);
        //    square.parentNode.replaceChild(clone, square);
        // });
        // A forma mais simples é apenas usar a flag gameEnded no handleSquareClick

        const winnerText = winningColor === 'white' ? 'Brancas' : 'Pretas';
        gameInfoElement.innerHTML = `<strong>FIM DE JOGO! ${winnerText.toUpperCase()} VENCEM!</strong>`;

        const existingResetButton = document.getElementById('reset-game-button');
        if (!existingResetButton) {
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Nova Partida';
            resetButton.id = 'reset-game-button';
            resetButton.addEventListener('click', initGame);
            controlsElement.appendChild(resetButton);
        }
    }

    function toggleNotation() {
        showNotation = !showNotation;
        updateNotationVisibility();
    }
    function updateNotationVisibility() {
        if (showNotation) boardContainer.classList.add('show-notation');
        else boardContainer.classList.remove('show-notation');
    }

    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        datetimeElement.textContent = now.toLocaleDateString('pt-BR', options);
    }

    function initGame() {
        gameEnded = false;
        boardElement.innerHTML = '';
        squares = [];
        boardState = [];

        const existingResetButton = document.getElementById('reset-game-button');
        if (existingResetButton) {
            existingResetButton.remove();
        }
        
        clearLastMoveHighlight();
        lastMove = { from: null, to: null };

        createCapturedPiecesContainers(); // Cria/limpa os containers de peças capturadas

        createBoard(); // Recria o tabuleiro e adiciona listeners

        currentPlayer = 'white';
        gameInfoElement.innerHTML = `Vez de: <span id="current-player-text">${currentPlayer === 'white' ? 'Brancas' : 'Pretas'}</span>`;
        // Precisamos reatribuir currentPlayerSpan, pois o elemento foi recriado:
        // No entanto, como só o conteúdo do span é alterado, a referência original a currentPlayerSpan deve permanecer válida.
        // Mas para garantir:
        // currentPlayerSpan = document.getElementById('current-player-text'); // Re-seleciona se o gameInfoElement.innerHTML o recriou.
        // Melhor: atualizar diretamente o span que sabemos que existe
        document.getElementById('current-player-text').textContent = 'Brancas';


        selectedSquareIndex = null;
        deselectPiece(); // Garante que não há seleção e limpa destaques

        updateDateTime();
        if (datetimeInterval) clearInterval(datetimeInterval); // Limpa intervalo anterior
        datetimeInterval = setInterval(updateDateTime, 1000); // Cria novo intervalo

        toggleNotationButton.removeEventListener('click', toggleNotation); // Evita duplicidade
        toggleNotationButton.addEventListener('click', toggleNotation);
        updateNotationVisibility(); // Aplica estado da notação
    }

    initGame();
});