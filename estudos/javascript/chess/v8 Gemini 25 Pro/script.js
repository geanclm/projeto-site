document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const boardElement = document.getElementById('board');
    const capturedPiecesWhiteContainer = document.querySelector('#captured-pieces-white .captured-piece-container');
    const capturedPiecesBlackContainer = document.querySelector('#captured-pieces-black .captured-piece-container');
    const toggleNotationButton = document.getElementById('toggle-notation');
    const datetimeElement = document.getElementById('datetime');
    const currentPlayerElement = document.getElementById('current-player');
    const boardContainer = document.querySelector('.board-container');
    const restartButton = document.getElementById('restart-button');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionButtons = promotionModal.querySelectorAll('button');
    const gameMessageElement = document.getElementById('game-message');
    const moveHistoryElement = document.getElementById('move-history');

    // Game State Variables
    let squares = [];
    let boardState = []; // Array 1D for logical board state
    let selectedSquareIndex = null;
    let currentPlayer = 'white';
    let showNotation = false;
    let gameActive = true;
    let kingPositions = { white: -1, black: -1 };
    let lastMove = { from: -1, to: -1, piece: null, capturedPiece: null, isEnPassant: false, isCastling: false, doublePushedPawnIndex: -1 };
    let promotionCallback = null;
    let moveCount = 0;


    // Sounds (with fallback)
    let moveSound, captureSound, checkSound, castlingSound, promoteSound, gameOverSound;
    try {
        moveSound = new Audio('sounds/move.mp3'); // Assuming sounds are in a 'sounds' folder
        captureSound = new Audio('sounds/capture.mp3');
        checkSound = new Audio('sounds/check.mp3');
        castlingSound = new Audio('sounds/castling.mp3');
        promoteSound = new Audio('sounds/promote.mp3');
        gameOverSound = new Audio('sounds/gameover.mp3');
    } catch (e) {
        console.warn("Could not load sound files. Sounds disabled.", e);
        const dummySound = { play: () => {} };
        moveSound = captureSound = checkSound = castlingSound = promoteSound = gameOverSound = dummySound;
    }

    // Piece Definitions (Unicode and properties)
    // White: ♔♕♖♗♘♙ | Black: ♚♛♜♝♞♟
    function getInitialPiece(index) {
        const pieceMap = {
            0: { type: 'rook', color: 'black', symbol: '♜', hasMoved: false }, 1: { type: 'knight', color: 'black', symbol: '♞' },
            2: { type: 'bishop', color: 'black', symbol: '♝' }, 3: { type: 'queen', color: 'black', symbol: '♛' },
            4: { type: 'king', color: 'black', symbol: '♚', hasMoved: false }, 5: { type: 'bishop', color: 'black', symbol: '♝' },
            6: { type: 'knight', color: 'black', symbol: '♞' }, 7: { type: 'rook', color: 'black', symbol: '♜', hasMoved: false },
            8: { type: 'pawn', color: 'black', symbol: '♟' }, 9: { type: 'pawn', color: 'black', symbol: '♟' },
            10: { type: 'pawn', color: 'black', symbol: '♟' }, 11: { type: 'pawn', color: 'black', symbol: '♟' },
            12: { type: 'pawn', color: 'black', symbol: '♟' }, 13: { type: 'pawn', color: 'black', symbol: '♟' },
            14: { type: 'pawn', color: 'black', symbol: '♟' }, 15: { type: 'pawn', color: 'black', symbol: '♟' },

            48: { type: 'pawn', color: 'white', symbol: '♙' }, 49: { type: 'pawn', color: 'white', symbol: '♙' },
            50: { type: 'pawn', color: 'white', symbol: '♙' }, 51: { type: 'pawn', color: 'white', symbol: '♙' },
            52: { type: 'pawn', color: 'white', symbol: '♙' }, 53: { type: 'pawn', color: 'white', symbol: '♙' },
            54: { type: 'pawn', color: 'white', symbol: '♙' }, 55: { type: 'pawn', color: 'white', symbol: '♙' },
            56: { type: 'rook', color: 'white', symbol: '♖', hasMoved: false }, 57: { type: 'knight', color: 'white', symbol: '♘' },
            58: { type: 'bishop', color: 'white', symbol: '♗' }, 59: { type: 'queen', color: 'white', symbol: '♕' },
            60: { type: 'king', color: 'white', symbol: '♔', hasMoved: false }, 61: { type: 'bishop', color: 'white', symbol: '♗' },
            62: { type: 'knight', color: 'white', symbol: '♘' }, 63: { type: 'rook', color: 'white', symbol: '♖', hasMoved: false },
        };
        const piece = pieceMap[index];
        if (piece && (piece.type === 'king' || piece.type === 'rook')) {
            return {...piece, hasMoved: false }; // Ensure hasMoved is reset
        }
        return piece || null;
    }

    // --- Board Creation ---
    function createBoard() {
        boardElement.innerHTML = '';
        squares = [];
        boardState = [];
        kingPositions = { white: -1, black: -1 };

        for (let i = 0; i < 64; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + Math.floor(i / 8)) % 2 === 0 ? 'white' : 'black');
            square.dataset.index = i;

            const pieceData = getInitialPiece(i);
            boardState[i] = pieceData ? { ...pieceData } : null; // Deep copy piece data

            if (boardState[i]) {
                if (boardState[i].type === 'king') {
                    kingPositions[boardState[i].color] = i;
                }
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                pieceElement.textContent = boardState[i].symbol;
                pieceElement.dataset.piece = boardState[i].type;
                pieceElement.dataset.color = boardState[i].color;
                square.appendChild(pieceElement);
            }

            square.addEventListener('click', () => handleSquareClick(i));
            boardElement.appendChild(square);
            squares.push(square);
            addNotation(square, i);
        }
        updateNotationVisibility();
    }

    // --- Notation ---
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
    function updateNotationVisibility() {
        boardContainer.classList.toggle('show-notation', showNotation);
    }
    function toggleNotationHandler() {
        showNotation = !showNotation;
        updateNotationVisibility();
    }

    // --- Square Click Handling ---
    function handleSquareClick(index) {
        if (!gameActive) return;
        clearHighlightsAndMessages();

        const clickedPieceData = boardState[index];

        if (selectedSquareIndex === null) {
            if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                selectPiece(index);
            }
        } else {
            const possibleMoves = getLegalMovesForPiece(selectedSquareIndex);
            const targetMove = possibleMoves.find(move => move.to === index);

            if (targetMove) {
                makeMove(selectedSquareIndex, index, targetMove.isCastling, targetMove.isEnPassant, targetMove.isPromotion);
            } else if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                deselectPiece();
                selectPiece(index);
            } else {
                deselectPiece();
            }
        }
    }

    // --- Piece Selection & Deselection ---
    function selectPiece(index) {
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

    // --- Highlighting ---
    function clearHighlights() {
        squares.forEach(sq => sq.classList.remove('highlight', 'capture-possible', 'king-in-check', 'last-move-highlight'));
    }
    function clearHighlightsAndMessages() {
        clearHighlights();
        gameMessageElement.textContent = '';
        // Re-apply check highlight if current king is in check
        const kingPos = kingPositions[currentPlayer];
        if (kingPos !== -1 && isSquareAttacked(kingPos, getOpponentColor(currentPlayer), boardState)) {
            squares[kingPos].classList.add('king-in-check');
            gameMessageElement.textContent = "XEQUE!";
        }
    }
    function highlightPossibleMoves(index) {
        const moves = getLegalMovesForPiece(index);
        moves.forEach(move => {
            squares[move.to].classList.add('highlight');
            if (move.isCapture || move.isEnPassant) {
                squares[move.to].classList.add('capture-possible');
            }
        });
    }
    function highlightLastMove(from, to) {
        squares.forEach(sq => sq.classList.remove('last-move-highlight'));
        if (from !== -1) squares[from].classList.add('last-move-highlight');
        if (to !== -1) squares[to].classList.add('last-move-highlight');
    }


    // --- Coordinate & Board Utils ---
    function indexToCoords(index) { return [Math.floor(index / 8), index % 8]; }
    function coordsToIndex(row, col) { return row * 8 + col; }
    function isWithinBoard(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }
    function getOpponentColor(color) { return color === 'white' ? 'black' : 'white'; }

    // --- Core Move Logic ---
    function makeMove(fromIndex, toIndex, isCastling = false, isEnPassant = false, isPromotion = false) {
        const pieceData = { ...boardState[fromIndex] }; // Copy piece data
        let capturedPiece = boardState[toIndex] ? { ...boardState[toIndex] } : null;
        let enPassantPawnIndex = -1;

        // Update hasMoved for king/rook
        if (pieceData.type === 'king' || pieceData.type === 'rook') {
            pieceData.hasMoved = true;
        }
         // Store current doublePushedPawnIndex for en passant validation next turn
        const previousDoublePushedPawn = lastMove.doublePushedPawnIndex;
        lastMove.doublePushedPawnIndex = -1; // Reset for current move

        // 1. Update boardState
        boardState[toIndex] = pieceData;
        boardState[fromIndex] = null;

        if (pieceData.type === 'king') {
            kingPositions[pieceData.color] = toIndex;
        }

        if (isCastling) {
            castlingSound.play();
            const rookFromIndex = (toIndex === kingPositions[pieceData.color] + 2 || toIndex === kingPositions[pieceData.color] -3 ) ? (toIndex > fromIndex ? 63 : 56) : (toIndex > fromIndex ? 7 : 0); // Simplified, needs robust check
            const rookToIndex = (toIndex > fromIndex) ? toIndex - 1 : toIndex + 1;
            if (toIndex === 62) { // White King-side
                 boardState[61] = boardState[63]; boardState[63] = null; boardState[61].hasMoved = true;
            } else if (toIndex === 58) { // White Queen-side
                 boardState[59] = boardState[56]; boardState[56] = null; boardState[59].hasMoved = true;
            } else if (toIndex === 6) { // Black King-side
                 boardState[5] = boardState[7]; boardState[7] = null; boardState[5].hasMoved = true;
            } else if (toIndex === 2) { // Black Queen-side
                 boardState[3] = boardState[0]; boardState[0] = null; boardState[3].hasMoved = true;
            }
        } else if (isEnPassant) {
            captureSound.play();
            const capturedPawnDirection = pieceData.color === 'white' ? 1 : -1;
            enPassantPawnIndex = toIndex + (capturedPawnDirection * 8);
            capturedPiece = { ...boardState[enPassantPawnIndex] }; // The pawn being captured en passant
            boardState[enPassantPawnIndex] = null;
        } else if (capturedPiece) {
            captureSound.play();
            addCapturedPiece(capturedPiece);
        } else {
            moveSound.play();
        }

        // Pawn specific logic
        if (pieceData.type === 'pawn') {
            // Double push for en passant tracking
            if (Math.abs(fromIndex - toIndex) === 16) {
                lastMove.doublePushedPawnIndex = toIndex;
            }
            // Promotion
            const promotionRank = pieceData.color === 'white' ? 0 : 7;
            if (indexToCoords(toIndex)[0] === promotionRank) {
                isPromotion = true; // Set flag
            }
        }
        
        lastMove = { from: fromIndex, to: toIndex, piece: pieceData, capturedPiece, isEnPassant, isCastling, doublePushedPawnIndex: lastMove.doublePushedPawnIndex };


        // 2. Update DOM
        updateBoardDOM();
        highlightLastMove(fromIndex, toIndex);
        deselectPiece(); // Deselect after move

        if (isPromotion) {
            promoteSound.play();
            handlePawnPromotion(toIndex, pieceData.color);
            return; // Promotion will handle next steps
        }

        switchPlayerAndCheckGameState();
    }

    function handlePawnPromotion(pawnIndex, color) {
        gameActive = false; // Pause game
        promotionModal.style.display = 'flex';
        promotionCallback = (promotedPieceType) => {
            const promotedPiece = {
                type: promotedPieceType,
                color: color,
                symbol: getPieceSymbol(promotedPieceType, color),
                hasMoved: true // Promoted pieces are like new pieces
            };
            boardState[pawnIndex] = promotedPiece;
            promotionModal.style.display = 'none';
            updateBoardDOM(); // Update with promoted piece
            gameActive = true;
            promotionCallback = null;
            switchPlayerAndCheckGameState(); // Now continue
        };
    }

    promotionButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (promotionCallback) {
                promotionCallback(button.dataset.piece);
            }
        });
    });

    function getPieceSymbol(type, color) {
        const symbols = {
            white: { queen: '♕', rook: '♖', bishop: '♗', knight: '♘' },
            black: { queen: '♛', rook: '♜', bishop: '♝', knight: '♞' }
        };
        return symbols[color][type];
    }


    // --- Game State Checks (Check, Checkmate, Stalemate) ---
    function isSquareAttacked(squareIndex, attackerColor, currentBoardState) {
        for (let i = 0; i < 64; i++) {
            const piece = currentBoardState[i];
            if (piece && piece.color === attackerColor) {
                const moves = getRawPossibleMoves(i, piece.type, piece.color, currentBoardState, true); // isCheckingAttack = true
                if (moves.some(move => move.to === squareIndex)) {
                    return true;
                }
            }
        }
        return false;
    }

    function isKingInCheck(kingColor, currentBoardState) {
        const kingPos = findKing(kingColor, currentBoardState);
        if (kingPos === -1) return false; // Should not happen
        return isSquareAttacked(kingPos, getOpponentColor(kingColor), currentBoardState);
    }

    function findKing(color, currentBoardState) {
        for (let i = 0; i < 64; i++) {
            if (currentBoardState[i] && currentBoardState[i].type === 'king' && currentBoardState[i].color === color) {
                return i;
            }
        }
        return -1; // Should not happen in a normal game
    }
    
    // Gets all legal moves for a player (filters out moves that leave king in check)
    function getAllLegalMoves(playerColor, currentBoardState) {
        let legalMoves = [];
        for (let i = 0; i < 64; i++) {
            const piece = currentBoardState[i];
            if (piece && piece.color === playerColor) {
                const pieceMoves = getLegalMovesForPiece(i, currentBoardState);
                legalMoves.push(...pieceMoves);
            }
        }
        return legalMoves;
    }

    // Gets legal moves for a specific piece (filters out self-check)
    function getLegalMovesForPiece(startIndex, currentBoardState = boardState) {
        const piece = currentBoardState[startIndex];
        if (!piece) return [];

        const rawMoves = getRawPossibleMoves(startIndex, piece.type, piece.color, currentBoardState);
        const legalMoves = [];

        for (const move of rawMoves) {
            const tempBoardState = simulateMove(startIndex, move.to, currentBoardState, move.isCastling, move.isEnPassant);
            if (!isKingInCheck(piece.color, tempBoardState)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }
    
    function simulateMove(fromIndex, toIndex, currentBoardState, isCastling = false, isEnPassant = false) {
        const tempBoardState = currentBoardState.map(p => p ? {...p} : null); // Deep copy
        const piece = {...tempBoardState[fromIndex]}; // Copy piece moving

        tempBoardState[toIndex] = piece;
        tempBoardState[fromIndex] = null;

        if (piece.type === 'king') {
            // No need to update kingPositions for simulation, just board state
        }

        if (isCastling) {
            const rookFromIndex = (toIndex === 62 || toIndex === 6) ? (piece.color === 'white' ? 63 : 7) : (piece.color === 'white' ? 56 : 0);
            const rookToIndex = (toIndex === 62 || toIndex === 6) ? toIndex - 1 : toIndex + 1;
            tempBoardState[rookToIndex] = tempBoardState[rookFromIndex];
            tempBoardState[rookFromIndex] = null;
        } else if (isEnPassant) {
            const capturedPawnDirection = piece.color === 'white' ? 1 : -1;
            const enPassantPawnIndex = toIndex + (capturedPawnDirection * 8);
            tempBoardState[enPassantPawnIndex] = null;
        }
        return tempBoardState;
    }


    // --- Get Raw Possible Moves (Core logic for each piece, without check validation yet) ---
    // isCheckingAttack: if true, doesn't consider castling or en-passant for attack checks, only basic moves/captures
    function getRawPossibleMoves(startIndex, pieceType, pieceColor, currentBoardState, isCheckingAttack = false) {
        switch (pieceType) {
            case 'pawn': return getPawnMoves(startIndex, pieceColor, currentBoardState, isCheckingAttack);
            case 'rook': return getRookMoves(startIndex, pieceColor, currentBoardState);
            case 'knight': return getKnightMoves(startIndex, pieceColor, currentBoardState);
            case 'bishop': return getBishopMoves(startIndex, pieceColor, currentBoardState);
            case 'queen': return getQueenMoves(startIndex, pieceColor, currentBoardState);
            case 'king': return getKingMoves(startIndex, pieceColor, currentBoardState, isCheckingAttack);
            default: return [];
        }
    }

    function getPawnMoves(startIndex, color, currentBoardState, isCheckingAttack = false) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        const direction = color === 'white' ? -1 : 1;
        const initialRank = color === 'white' ? 6 : 1;
        const promotionRank = color === 'white' ? 0 : 7;

        // 1. Move one step forward
        let targetRow = startRow + direction;
        if (isWithinBoard(targetRow, startCol) && !currentBoardState[coordsToIndex(targetRow, startCol)]) {
            const isPromotion = targetRow === promotionRank;
            moves.push({ from: startIndex, to: coordsToIndex(targetRow, startCol), isCapture: false, isPromotion });
            // 2. Move two steps forward (from initial rank)
            if (startRow === initialRank && !isCheckingAttack) {
                targetRow = startRow + 2 * direction;
                if (isWithinBoard(targetRow, startCol) && !currentBoardState[coordsToIndex(targetRow, startCol)]) {
                    moves.push({ from: startIndex, to: coordsToIndex(targetRow, startCol), isCapture: false, isPromotion: false, isDoublePush: true });
                }
            }
        }

        // 3. Captures
        [-1, 1].forEach(colOffset => {
            targetRow = startRow + direction;
            const targetCol = startCol + colOffset;
            if (isWithinBoard(targetRow, targetCol)) {
                const targetIndex = coordsToIndex(targetRow, targetCol);
                const targetPiece = currentBoardState[targetIndex];
                if (targetPiece && targetPiece.color !== color) {
                     const isPromotion = targetRow === promotionRank;
                    moves.push({ from: startIndex, to: targetIndex, isCapture: true, isPromotion });
                }
            }
        });
        
        // 4. En Passant (only if not just checking attacks)
        if (!isCheckingAttack && lastMove.doublePushedPawnIndex !== -1) {
            const opponentPawnIndex = lastMove.doublePushedPawnIndex;
            const [opponentPawnRow, opponentPawnCol] = indexToCoords(opponentPawnIndex);
            if (startRow === opponentPawnRow && Math.abs(startCol - opponentPawnCol) === 1) {
                 const targetEnPassantIndex = coordsToIndex(startRow + direction, opponentPawnCol);
                 moves.push({from: startIndex, to: targetEnPassantIndex, isCapture: true, isEnPassant: true, isPromotion: false});
            }
        }
        return moves;
    }

    function getRookMoves(startIndex, color, currentBoardState) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const [startRow, startCol] = indexToCoords(startIndex);
        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; i < 8; i++) {
                const r = startRow + i * dRow;
                const c = startCol + i * dCol;
                if (!isWithinBoard(r, c)) break;
                const targetIndex = coordsToIndex(r, c);
                const targetPiece = currentBoardState[targetIndex];
                if (targetPiece) {
                    if (targetPiece.color !== color) moves.push({ from: startIndex, to: targetIndex, isCapture: true });
                    break;
                }
                moves.push({ from: startIndex, to: targetIndex, isCapture: false });
            }
        });
        return moves;
    }

    function getKnightMoves(startIndex, color, currentBoardState) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        offsets.forEach(([dRow, dCol]) => {
            const r = startRow + dRow;
            const c = startCol + dCol;
            if (isWithinBoard(r, c)) {
                const targetIndex = coordsToIndex(r, c);
                const targetPiece = currentBoardState[targetIndex];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ from: startIndex, to: targetIndex, isCapture: !!targetPiece });
                }
            }
        });
        return moves;
    }

    function getBishopMoves(startIndex, color, currentBoardState) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        const [startRow, startCol] = indexToCoords(startIndex);
        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; i < 8; i++) {
                const r = startRow + i * dRow;
                const c = startCol + i * dCol;
                if (!isWithinBoard(r, c)) break;
                const targetIndex = coordsToIndex(r, c);
                const targetPiece = currentBoardState[targetIndex];
                if (targetPiece) {
                    if (targetPiece.color !== color) moves.push({ from: startIndex, to: targetIndex, isCapture: true });
                    break;
                }
                moves.push({ from: startIndex, to: targetIndex, isCapture: false });
            }
        });
        return moves;
    }

    function getQueenMoves(startIndex, color, currentBoardState) {
        return [
            ...getRookMoves(startIndex, color, currentBoardState),
            ...getBishopMoves(startIndex, color, currentBoardState)
        ];
    }

    function getKingMoves(startIndex, color, currentBoardState, isCheckingAttack = false) {
        const moves = [];
        const [startRow, startCol] = indexToCoords(startIndex);
        const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        offsets.forEach(([dRow, dCol]) => {
            const r = startRow + dRow;
            const c = startCol + dCol;
            if (isWithinBoard(r, c)) {
                const targetIndex = coordsToIndex(r, c);
                const targetPiece = currentBoardState[targetIndex];
                 // For basic attack checks, we don't need to simulate if the target square is attacked
                if (!isCheckingAttack && isSquareAttacked(targetIndex, getOpponentColor(color), currentBoardState)) {
                    // King cannot move into check - this check is done by getLegalMovesForPiece
                } else if (!targetPiece || targetPiece.color !== color) {
                     moves.push({ from: startIndex, to: targetIndex, isCapture: !!targetPiece });
                }
            }
        });

        // Castling (only if not just checking attacks)
        if (!isCheckingAttack && !currentBoardState[startIndex].hasMoved && !isKingInCheck(color, currentBoardState)) {
            // King-side
            const kingSideRookIndex = color === 'white' ? 63 : 7;
            if (currentBoardState[kingSideRookIndex] && currentBoardState[kingSideRookIndex].type === 'rook' && !currentBoardState[kingSideRookIndex].hasMoved) {
                if (!currentBoardState[startIndex + 1] && !currentBoardState[startIndex + 2]) {
                    if (!isSquareAttacked(startIndex + 1, getOpponentColor(color), currentBoardState) &&
                        !isSquareAttacked(startIndex + 2, getOpponentColor(color), currentBoardState)) {
                        moves.push({ from: startIndex, to: startIndex + 2, isCastling: true });
                    }
                }
            }
            // Queen-side
            const queenSideRookIndex = color === 'white' ? 56 : 0;
             if (currentBoardState[queenSideRookIndex] && currentBoardState[queenSideRookIndex].type === 'rook' && !currentBoardState[queenSideRookIndex].hasMoved) {
                if (!currentBoardState[startIndex - 1] && !currentBoardState[startIndex - 2] && !currentBoardState[startIndex - 3]) {
                     if (!isSquareAttacked(startIndex - 1, getOpponentColor(color), currentBoardState) &&
                         !isSquareAttacked(startIndex - 2, getOpponentColor(color), currentBoardState)) { // King doesn't pass through -3
                        moves.push({ from: startIndex, to: startIndex - 2, isCastling: true });
                    }
                }
            }
        }
        return moves;
    }


    // --- DOM Updates ---
    function updateBoardDOM() {
        for (let i = 0; i < 64; i++) {
            const squareElement = squares[i];
            const pieceData = boardState[i];
            const existingPieceElement = squareElement.querySelector('.piece');

            if (existingPieceElement) {
                squareElement.removeChild(existingPieceElement);
            }
            if (pieceData) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                pieceElement.textContent = pieceData.symbol;
                pieceElement.dataset.piece = pieceData.type;
                pieceElement.dataset.color = pieceData.color;
                squareElement.appendChild(pieceElement);
            }
        }
    }
    function addCapturedPiece(pieceData) {
        const capturedPieceElement = document.createElement('span');
        capturedPieceElement.classList.add('captured-piece');
        capturedPieceElement.textContent = pieceData.symbol;
        if (pieceData.color === 'white') { // White piece captured by Black
            capturedPiecesBlackContainer.appendChild(capturedPieceElement);
        } else { // Black piece captured by White
            capturedPiecesWhiteContainer.appendChild(capturedPieceElement);
        }
    }
    function updateMoveHistory(from, to, piece, captured, isCheck, isCheckmate, isStalemate, isCastling, promotedTo) {
        moveCount++;
        let moveNotation = "";
        if (moveCount % 2 !== 0 && currentPlayer === 'black') { // White just moved
            moveNotation += `${Math.ceil(moveCount / 2)}. `;
        } else if (moveCount % 2 === 0 && currentPlayer === 'white') { // Black just moved
             // moveNotation += `   `; // Indent black's move or handle in CSS
        }


        if (isCastling) {
            moveNotation += (to > from) ? "O-O" : "O-O-O"; // Simplistic
        } else {
            // Basic notation: e.g., e2-e4 or Nf3
            const pieceSymbolMap = { pawn: "", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" };
            moveNotation += pieceSymbolMap[piece.type] || ""; // Piece initial (empty for pawn)
            // Disambiguation (if needed, complex)
            // From square (optional for pawns unless capture)
            // moveNotation += indexToAlgebraic(from); // if needed for clarity
            moveNotation += captured ? "x" : "";
            moveNotation += indexToAlgebraic(to);
            if (promotedTo) {
                moveNotation += "=" + pieceSymbolMap[promotedTo].toUpperCase();
            }
        }

        if (isCheckmate) moveNotation += "#";
        else if (isCheck) moveNotation += "+";
        
        const listItem = document.createElement('li');
        listItem.textContent = moveNotation;
        moveHistoryElement.appendChild(listItem);
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight; // Auto-scroll
    }

    function indexToAlgebraic(index) {
        if (index < 0 || index > 63) return "";
        const file = String.fromCharCode(97 + (index % 8));
        const rank = 8 - Math.floor(index / 8);
        return file + rank;
    }


    // --- Player Switching and Game End ---
    function switchPlayerAndCheckGameState() {
        currentPlayer = getOpponentColor(currentPlayer);
        currentPlayerElement.textContent = currentPlayer === 'white' ? 'Brancas' : 'Pretas';
        gameMessageElement.textContent = ''; // Clear previous message

        const legalMovesForCurrentPlayer = getAllLegalMoves(currentPlayer, boardState);
        const kingIsCurrentlyInCheck = isKingInCheck(currentPlayer, boardState);

        if (kingIsCurrentlyInCheck) {
            checkSound.play();
            squares[kingPositions[currentPlayer]].classList.add('king-in-check');
            gameMessageElement.textContent = "XEQUE!";
        }

        if (legalMovesForCurrentPlayer.length === 0) {
            gameActive = false;
            gameOverSound.play();
            if (kingIsCurrentlyInCheck) {
                gameMessageElement.textContent = `XEQUE-MATE! ${getOpponentColor(currentPlayer).toUpperCase()} VENCE!`;
                updateMoveHistory(lastMove.from, lastMove.to, lastMove.piece, lastMove.capturedPiece, false, true, false, lastMove.isCastling, boardState[lastMove.to]?.type !== lastMove.piece?.type ? boardState[lastMove.to]?.type : null);

            } else {
                gameMessageElement.textContent = "EMPATE POR AFOGAMENTO!";
                 updateMoveHistory(lastMove.from, lastMove.to, lastMove.piece, lastMove.capturedPiece, false, false, true, lastMove.isCastling, boardState[lastMove.to]?.type !== lastMove.piece?.type ? boardState[lastMove.to]?.type : null);
            }
        } else {
             updateMoveHistory(lastMove.from, lastMove.to, lastMove.piece, lastMove.capturedPiece, kingIsCurrentlyInCheck, false, false, lastMove.isCastling, boardState[lastMove.to]?.type !== lastMove.piece?.type ? boardState[lastMove.to]?.type : null);
        }
    }


    // --- Date & Time ---
    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        datetimeElement.textContent = now.toLocaleDateString('pt-BR', options);
    }

    // --- Initialization ---
    function initGame() {
        gameActive = true;
        createBoard(); // This also resets boardState and kingPositions
        currentPlayer = 'white';
        currentPlayerElement.textContent = 'Brancas';
        selectedSquareIndex = null;
        capturedPiecesWhiteContainer.innerHTML = '';
        capturedPiecesBlackContainer.innerHTML = '';
        gameMessageElement.textContent = '';
        moveHistoryElement.innerHTML = '';
        moveCount = 0;
        lastMove = { from: -1, to: -1, piece: null, capturedPiece: null, isEnPassant: false, isCastling: false, doublePushedPawnIndex: -1 };
        promotionCallback = null;
        promotionModal.style.display = 'none';
        clearHighlights();
        updateDateTime();
    }

    // --- Event Listeners ---
    toggleNotationButton.addEventListener('click', toggleNotationHandler);
    restartButton.addEventListener('click', initGame);

    // --- Start Game ---
    initGame();
    setInterval(updateDateTime, 1000);
});