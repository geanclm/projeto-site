document.addEventListener('DOMContentLoaded', function() {
    // --- Configurações Visuais e Recursos ---
    const PIECE_IMAGES_URL = "https://upload.wikimedia.org/wikipedia/commons/";
    // Mapeamento para os sufixos dos arquivos SVG da Wikipedia:
    // Ex: Bispo Preto = '9/98/Chess_bdt45.svg'
    // Como as URLs da Wikipedia são complexas, usaremos um mapeamento simplificado base
    // Se preferir, baixe as imagens e use caminhos locais.
    const pieceSvgMap = {
        white: {
            pawn: '4/45/Chess_plt45.svg', rook: '7/72/Chess_rlt45.svg', knight: '7/70/Chess_nlt45.svg',
            bishop: 'b/b1/Chess_blt45.svg', queen: '1/15/Chess_qlt45.svg', king: '4/42/Chess_klt45.svg'
        },
        black: {
            pawn: 'c/c7/Chess_pdt45.svg', rook: 'f/ff/Chess_rdt45.svg', knight: 'e/ef/Chess_ndt45.svg',
            bishop: '9/98/Chess_bdt45.svg', queen: '4/47/Chess_qdt45.svg', king: 'f/f0/Chess_kdt45.svg'
        }
    };

    // --- DOM Elements ---
    const boardElement = document.getElementById('board');
    // Containers agora são genéricos (topo/baixo) e trocam de dono ao inverter tabuleiro
    const capturedContainerTop = document.querySelector('#captured-pieces-top .captured-piece-container');
    const capturedContainerBottom = document.querySelector('#captured-pieces-bottom .captured-piece-container');
    const capturedTitleTop = document.getElementById('captured-title-top');
    const capturedTitleBottom = document.getElementById('captured-title-bottom');

    const toggleNotationButton = document.getElementById('toggle-notation');
    const undoButton = document.getElementById('undo-button');
    const flipButton = document.getElementById('flip-board-button');
    const restartButton = document.getElementById('restart-button');
    
    const datetimeElement = document.getElementById('datetime');
    const currentPlayerElement = document.getElementById('current-player');
    const boardContainer = document.querySelector('.board-container');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionButtons = promotionModal.querySelectorAll('button');
    const gameMessageElement = document.getElementById('game-message');
    const moveHistoryElement = document.getElementById('move-history');

    // --- Game State ---
    let squares = [];
    let boardState = []; 
    let selectedSquareIndex = null;
    let currentPlayer = 'white';
    let boardOrientation = 'white'; // 'white' ou 'black' (quem está embaixo)
    let showNotation = false;
    let gameActive = true;
    let kingPositions = { white: -1, black: -1 };
    let lastMove = { from: -1, to: -1, piece: null, capturedPiece: null, isEnPassant: false, isCastling: false, doublePushedPawnIndex: -1 };
    let moveCount = 0;
    
    // Histórico para Undo
    let gameHistory = [];

    // Sounds (Placeholders)
    const sounds = {
        move: new Audio('sounds/move.mp3'),
        capture: new Audio('sounds/capture.mp3'),
        check: new Audio('sounds/check.mp3'),
        gameOver: new Audio('sounds/gameover.mp3')
    };
    // Fallback silencioso se falhar
    Object.values(sounds).forEach(s => s.onerror = () => s.muted = true);

    // --- Inicialização de Peças ---
    function getInitialPiece(index) {
        // Mapa padrão fen-like
        const setup = [
            'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook', // 0-7 (Pretas)
            'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'          // 8-15
        ];
        // 48-63 são brancas (espelhado)
        
        let type = null;
        let color = null;

        if (index >= 0 && index <= 15) color = 'black';
        if (index >= 48 && index <= 63) color = 'white';

        if (color) {
            if (index >= 8 && index <= 15) type = 'pawn';
            else if (index >= 48 && index <= 55) type = 'pawn';
            else {
                const rowOffset = color === 'black' ? 0 : 56;
                type = setup[index - rowOffset];
            }
            return { type, color, hasMoved: false };
        }
        return null;
    }

    // --- Controle de Estado (History & Undo) ---
    function saveState() {
        gameHistory.push({
            boardState: JSON.parse(JSON.stringify(boardState)), // Deep copy
            currentPlayer,
            kingPositions: { ...kingPositions },
            lastMove: { ...lastMove },
            moveCount,
            gameActive
            // Nota: Captured pieces visual é reconstruído baseado no boardState, 
            // mas para precisão total deveríamos salvar a lista de capturas. 
            // Simplificação: vamos recalcular capturas ao dar undo seria complexo,
            // então vamos salvar o HTML ou apenas permitir desfazer lógica e limpar visual.
            // Solução Robusta: Recalcular capturas baseado no que falta no tabuleiro.
        });
    }

    function undoLastMove() {
        if (gameHistory.length === 0 || !gameActive) return;
        
        const previousState = gameHistory.pop();
        boardState = previousState.boardState;
        currentPlayer = previousState.currentPlayer;
        kingPositions = previousState.kingPositions;
        lastMove = previousState.lastMove;
        moveCount = previousState.moveCount;
        gameActive = previousState.gameActive;

        // Limpar UI e recriar
        selectedSquareIndex = null;
        createBoard(); // Re-renderiza tudo
        updateStatusUI();
        recalculateCapturedUI(); // Função auxiliar para corrigir painel de capturas
        
        // Remove último item da lista visual
        if (moveHistoryElement.lastChild) moveHistoryElement.lastChild.remove();
        
        clearHighlights();
        if (lastMove.from !== -1) highlightLastMove(lastMove.from, lastMove.to);
    }

    // --- Tabuleiro e Renderização ---
    function createBoard() {
        boardElement.innerHTML = '';
        squares = []; // Reinicia referências DOM

        // Loop visual de 0 a 63
        for (let i = 0; i < 64; i++) {
            const squareElement = document.createElement('div');
            
            // Cálculos de Coordenadas
            // Se o tabuleiro estiver invertido, o visual 0 é o lógico 63.
            const logicalIndex = boardOrientation === 'white' ? i : 63 - i;
            const row = Math.floor(logicalIndex / 8);
            const col = logicalIndex % 8;
            
            squareElement.classList.add('square');
            // A cor do quadrado depende da posição física (row/col), não do índice lógico apenas
            squareElement.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            squareElement.dataset.index = logicalIndex;

            // Renderizar Peça
            const pieceData = boardState[logicalIndex];
            if (pieceData) {
                renderPiece(squareElement, pieceData);
                if (pieceData.type === 'king') kingPositions[pieceData.color] = logicalIndex;
            }

            // Eventos
            squareElement.addEventListener('click', () => handleSquareClick(logicalIndex));
            
            // Notação
            addNotation(squareElement, row, col);

            boardElement.appendChild(squareElement);
            squares[logicalIndex] = squareElement; // Mantemos o array squares indexado logicamente
        }
        
        updateNotationVisibility();
        updateStatusUI();
    }

    function renderPiece(square, pieceData) {
        const pieceDiv = document.createElement('div');
        pieceDiv.classList.add('piece');
        const imgUrl = PIECE_IMAGES_URL + pieceSvgMap[pieceData.color][pieceData.type];
        pieceDiv.style.backgroundImage = `url('${imgUrl}')`;
        square.appendChild(pieceDiv);
    }

    function addNotation(square, row, col) {
        const file = String.fromCharCode(97 + col); // a, b, c...
        const rank = 8 - row; // 8, 7, 6...

        // Exibir letras na base (visual)
        // Se orientação branca: rank 7 (linha 8 visual) tem letras.
        // Se preta: rank 0 (linha 1 visual -> topo no lógico, mas base visual) tem letras.
        // Lógica simplificada: A última linha VISUAL recebe letras.
        
        const isBottomRowVisual = boardOrientation === 'white' ? row === 7 : row === 0;
        const isLeftColVisual = boardOrientation === 'white' ? col === 0 : col === 7;

        if (isBottomRowVisual) {
            const fileSpan = document.createElement('span');
            fileSpan.className = 'notation file-notation';
            fileSpan.textContent = file;
            square.appendChild(fileSpan);
        }
        if (isLeftColVisual) {
            const rankSpan = document.createElement('span');
            rankSpan.className = 'notation rank-notation';
            rankSpan.textContent = rank;
            square.appendChild(rankSpan);
        }
    }

    function flipBoard() {
        boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
        createBoard();
        // Atualizar títulos das capturas
        if (boardOrientation === 'white') {
            capturedTitleTop.textContent = "Capturadas (Brancas):"; // Brancas capturam pretas, mas costumam ficar perto do jogador. Vamos manter simples: Topo = Oponente.
            capturedTitleTop.textContent = "Capturadas (Pretas):"; // Peças pretas capturadas
            capturedTitleBottom.textContent = "Capturadas (Brancas):"; // Peças brancas capturadas
        } else {
            capturedTitleTop.textContent = "Capturadas (Brancas):";
            capturedTitleBottom.textContent = "Capturadas (Pretas):";
        }
        // Simplesmente trocando o conteúdo visual das caixas de captura para combinar com a orientação
        const contentTop = capturedContainerTop.innerHTML;
        capturedContainerTop.innerHTML = capturedContainerBottom.innerHTML;
        capturedContainerBottom.innerHTML = contentTop;
        
        // Re-highlight last move
        if (lastMove.from !== -1) highlightLastMove(lastMove.from, lastMove.to);
    }

    // --- Lógica do Jogo ---

    function handleSquareClick(index) {
        if (!gameActive) return;
        
        // Verifica xeque para limpar visual
        const kingPos = kingPositions[currentPlayer];
        const inCheck = isKingInCheck(currentPlayer, boardState);
        clearHighlights();
        if (inCheck) squares[kingPos].classList.add('king-in-check');

        const clickedPieceData = boardState[index];

        // Seleção
        if (selectedSquareIndex === null) {
            if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                selectPiece(index);
            }
        } else {
            // Movimento ou Troca de Seleção
            if (selectedSquareIndex === index) {
                deselectPiece();
                return;
            }

            const possibleMoves = getLegalMovesForPiece(selectedSquareIndex);
            const targetMove = possibleMoves.find(move => move.to === index);

            if (targetMove) {
                saveState(); // Salva antes de mover
                executeMove(targetMove);
            } else if (clickedPieceData && clickedPieceData.color === currentPlayer) {
                deselectPiece();
                selectPiece(index);
            } else {
                deselectPiece();
            }
        }
    }

    function selectPiece(index) {
        selectedSquareIndex = index;
        squares[index].classList.add('selected');
        const moves = getLegalMovesForPiece(index);
        moves.forEach(move => {
            squares[move.to].classList.add('highlight');
            if (move.isCapture || move.isEnPassant) {
                squares[move.to].classList.add('capture-possible');
            }
        });
    }

    function deselectPiece() {
        if (selectedSquareIndex !== null && squares[selectedSquareIndex]) {
            squares[selectedSquareIndex].classList.remove('selected');
        }
        selectedSquareIndex = null;
        clearHighlights();
        // Re-aplica xeque visual se necessário
        if (isKingInCheck(currentPlayer, boardState)) {
             squares[kingPositions[currentPlayer]].classList.add('king-in-check');
        }
        if (lastMove.from !== -1) highlightLastMove(lastMove.from, lastMove.to);
    }

    function executeMove(move) {
        const fromIndex = move.from;
        const toIndex = move.to;
        const piece = boardState[fromIndex];
        
        let capturedPiece = boardState[toIndex];
        
        // Atualizar tabuleiro lógico
        boardState[toIndex] = piece;
        boardState[fromIndex] = null;
        piece.hasMoved = true;
        
        if (piece.type === 'king') kingPositions[piece.color] = toIndex;

        // Efeitos Especiais
        if (move.isCastling) {
            const isKingSide = toIndex > fromIndex;
            const rookFrom = isKingSide ? toIndex + 1 : toIndex - 2;
            const rookTo = isKingSide ? toIndex - 1 : toIndex + 1;
            // Correção de índices para roque
            // Se KingSide (62): Torre está em 63, vai para 61.
            // Se QueenSide (58): Torre está em 56, vai para 59.
            // Lógica genérica baseada na linha:
            const row = Math.floor(fromIndex / 8);
            const rFrom = isKingSide ? (row * 8 + 7) : (row * 8 + 0);
            const rTo   = isKingSide ? (row * 8 + 5) : (row * 8 + 3);
            
            boardState[rTo] = boardState[rFrom];
            boardState[rFrom] = null;
            if (boardState[rTo]) boardState[rTo].hasMoved = true;
        }

        if (move.isEnPassant) {
            const direction = piece.color === 'white' ? 1 : -1; // Captura está "atrás" visualmente do destino? Não, está na mesma linha.
            // Se peão branco vai para cima (row diminui), o peão preto estava em toIndex + 8
            const pawnToCaptureIndex = toIndex + (piece.color === 'white' ? 8 : -8);
            capturedPiece = boardState[pawnToCaptureIndex];
            boardState[pawnToCaptureIndex] = null;
            // Atualizar visual da captura en passant manualmente aqui ou re-renderizar
            squares[pawnToCaptureIndex].innerHTML = ''; 
        }

        // Atualizar Som e Histórico de Capturas
        if (capturedPiece || move.isEnPassant) {
            sounds.capture.play().catch(() => {});
            addCapturedPieceVisual(capturedPiece || {type: 'pawn', color: getOpponentColor(piece.color)});
        } else {
            sounds.move.play().catch(() => {});
        }

        // Promoção
        if (move.isPromotion) {
            deselectPiece();
            createBoard(); // Atualiza visual antes do modal
            handlePromotion(toIndex, piece.color);
            return; // Pausa fluxo até escolha
        }

        // Finalizar turno
        finalizeTurn(fromIndex, toIndex, piece, capturedPiece, move);
    }

    function finalizeTurn(from, to, piece, captured, moveDetails) {
        lastMove = { 
            from, to, piece, capturedPiece: captured, 
            isEnPassant: moveDetails.isEnPassant, 
            isCastling: moveDetails.isCastling,
            doublePushedPawnIndex: moveDetails.isDoublePush ? to : -1
        };
        moveCount++;

        createBoard(); // Re-renderização total garante consistência (útil para En Passant/Roque)
        
        switchPlayer();
    }

    function handlePromotion(index, color) {
        gameActive = false;
        promotionModal.style.display = 'flex';
        
        // Define o callback temporário para os botões
        const onPromote = (e) => {
            const type = e.target.dataset.piece;
            boardState[index].type = type;
            promotionModal.style.display = 'none';
            gameActive = true;
            
            // Limpa listeners antigos para não duplicar
            promotionButtons.forEach(b => b.removeEventListener('click', b._listener));
            
            finalizeTurn(lastMove.from, lastMove.to, boardState[index], lastMove.capturedPiece, {isPromotion: true});
        };

        promotionButtons.forEach(b => {
            b._listener = onPromote;
            b.addEventListener('click', onPromote);
        });
    }

    function switchPlayer() {
        currentPlayer = getOpponentColor(currentPlayer);
        updateStatusUI();

        // Verifica estado final (Mate/Afogamento)
        const moves = getAllLegalMoves(currentPlayer, boardState);
        const inCheck = isKingInCheck(currentPlayer, boardState);

        if (inCheck) sounds.check.play().catch(() => {});

        let statusText = "";
        if (moves.length === 0) {
            gameActive = false;
            if (inCheck) {
                statusText = `XEQUE-MATE! ${getOpponentColor(currentPlayer).toUpperCase()} VENCEU!`;
                sounds.gameOver.play().catch(() => {});
            } else {
                statusText = "EMPATE POR AFOGAMENTO (STALEMATE)!";
            }
        } else if (inCheck) {
            statusText = "XEQUE!";
        }

        gameMessageElement.textContent = statusText;
        
        // Adicionar ao histórico visual
        addToMoveHistory(lastMove, inCheck, moves.length === 0 && inCheck);
    }

    // --- Validação de Movimentos (Com Correção de Roque) ---

    function getLegalMovesForPiece(index, state = boardState) {
        const piece = state[index];
        if (!piece) return [];
        const rawMoves = getRawPossibleMoves(index, piece.type, piece.color, state);
        
        // Filtra movimentos que deixam o rei em xeque
        return rawMoves.filter(move => {
            const simState = simulateMove(index, move.to, state, move.isEnPassant, move.isCastling);
            return !isKingInCheck(piece.color, simState);
        });
    }

    function getRawPossibleMoves(index, type, color, state, checkingAttack = false) {
        const moves = [];
        const [r, c] = getCoords(index);
        const opponent = getOpponentColor(color);

        const addIfValid = (tr, tc, isCaptureOnly = false, isMoveOnly = false) => {
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return;
            const tIndex = tr * 8 + tc;
            const target = state[tIndex];
            
            if (target) {
                if (!isMoveOnly && target.color === opponent) {
                    moves.push({ from: index, to: tIndex, isCapture: true, isPromotion: (type === 'pawn' && (tr === 0 || tr === 7)) });
                }
            } else {
                if (!isCaptureOnly) {
                    moves.push({ from: index, to: tIndex, isCapture: false, isPromotion: (type === 'pawn' && (tr === 0 || tr === 7)) });
                }
            }
            return !!target; // Retorna true se bloqueado
        };

        // Lógica simplificada por tipo
        if (type === 'pawn') {
            const dir = color === 'white' ? -1 : 1;
            const startRow = color === 'white' ? 6 : 1;
            
            // Andar 1
            if (!state[(r + dir) * 8 + c] && !checkingAttack) {
                addIfValid(r + dir, c, false, true);
                // Andar 2
                if (r === startRow && !state[(r + dir * 2) * 8 + c]) {
                    moves.push({ from: index, to: (r + dir * 2) * 8 + c, isDoublePush: true });
                }
            }
            // Capturar
            [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
                const tr = r + dr, tc = c + dc;
                if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
                    const tIdx = tr * 8 + tc;
                    if (state[tIdx] && state[tIdx].color === opponent) {
                        moves.push({ from: index, to: tIdx, isCapture: true, isPromotion: (tr === 0 || tr === 7) });
                    }
                    // En Passant
                    if (!checkingAttack && lastMove.doublePushedPawnIndex === (r * 8 + tc)) {
                        moves.push({ from: index, to: tIdx, isCapture: true, isEnPassant: true });
                    }
                }
            });
        }
        
        else if (type === 'knight') {
            [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addIfValid(r+dr, c+dc));
        }
        
        else if (type === 'king') {
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => addIfValid(r+dr, c+dc));
            
            // Roque (Lógica Corrigida)
            if (!checkingAttack && !piece.hasMoved && !isKingInCheck(color, state)) {
                // Kingside
                if (canCastle(index, 7, [1, 2], color, state)) {
                    moves.push({ from: index, to: index + 2, isCastling: true });
                }
                // Queenside
                if (canCastle(index, 0, [-1, -2, -3], color, state)) {
                    // Nota: índice de destino do rei é -2, mas checamos -1 e -2 por ataque
                    moves.push({ from: index, to: index - 2, isCastling: true });
                }
            }
        }
        
        else { // Bishop, Rook, Queen
            const dirs = [];
            if (type !== 'bishop') dirs.push([-1,0],[1,0],[0,-1],[0,1]); // Rook/Queen
            if (type !== 'rook') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]); // Bishop/Queen
            
            dirs.forEach(([dr, dc]) => {
                let tr = r + dr, tc = c + dc;
                while (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
                    const blocked = addIfValid(tr, tc);
                    if (blocked) break;
                    tr += dr; tc += dc;
                }
            });
        }
        return moves;
    }

    // Função Auxiliar de Roque Corrigida
    function canCastle(kingIdx, rookColRelativeToRow, pathOffsets, color, state) {
        const row = Math.floor(kingIdx / 8);
        const rookIdx = row * 8 + rookColRelativeToRow;
        const rook = state[rookIdx];

        if (!rook || rook.type !== 'rook' || rook.hasMoved || rook.color !== color) return false;

        // Verificar caminho livre e seguro
        // pathOffsets são relativos ao Rei. Ex: Kingside [1, 2], Queenside [-1, -2, -3]
        for (let offset of pathOffsets) {
            const idx = kingIdx + offset;
            if (state[idx]) return false; // Bloqueado por peça
            
            // Regra crucial: O rei não pode passar por casa atacada.
            // No Queenside, a casa -3 (b1/b8) pode estar atacada, o rei apenas passa por -1 e -2.
            // Então só checamos ataque se for o passo 1 ou 2.
            if (Math.abs(offset) <= 2) {
                if (isSquareAttacked(idx, getOpponentColor(color), state)) return false;
            }
        }
        return true;
    }

    function isSquareAttacked(targetIndex, attackerColor, state) {
        // Itera todas as peças do atacante e vê se alcançam targetIndex
        for (let i = 0; i < 64; i++) {
            const piece = state[i];
            if (piece && piece.color === attackerColor) {
                const moves = getRawPossibleMoves(i, piece.type, piece.color, state, true);
                if (moves.some(m => m.to === targetIndex)) return true;
            }
        }
        return false;
    }

    function isKingInCheck(color, state) {
        const kPos = findKing(color, state);
        return kPos !== -1 && isSquareAttacked(kPos, getOpponentColor(color), state);
    }

    // --- Utilitários ---
    function getCoords(index) { return [Math.floor(index / 8), index % 8]; }
    function getOpponentColor(c) { return c === 'white' ? 'black' : 'white'; }
    function findKing(c, s) { return s.findIndex(p => p && p.type === 'king' && p.color === c); }
    
    function simulateMove(from, to, state, enPassant, castling) {
        const copy = state.map(p => p ? {...p} : null);
        copy[to] = copy[from];
        copy[from] = null;
        if (enPassant) {
            const dir = copy[to].color === 'white' ? 1 : -1;
            copy[to + (dir * 8)] = null;
        }
        // Nota: Simulação de roque para check não é estritamente necessária se a validação inicial for robusta
        return copy;
    }

    function getAllLegalMoves(color, state) {
        let moves = [];
        state.forEach((p, i) => {
            if (p && p.color === color) moves.push(...getLegalMovesForPiece(i, state));
        });
        return moves;
    }

    function updateStatusUI() {
        currentPlayerElement.textContent = currentPlayer === 'white' ? 'Brancas' : 'Pretas';
        datetimeElement.textContent = new Date().toLocaleString('pt-BR');
    }

    function addCapturedPieceVisual(piece) {
        const container = piece.color === 'white' 
            ? document.querySelector('.captured-pieces.captured-white .captured-piece-container') // Peças brancas capturadas (ficam no container preto se lógica inversa, mas aqui vamos simplificar: container específico)
            : document.querySelector('.captured-pieces.captured-black .captured-piece-container');
        
        // Na estrutura HTML nova: 
        // captured-pieces-top -> Capturadas (Brancas) [peças brancas comidas pelo preto] ?
        // Convenção: Painel mostra peças que VOCÊ capturou do oponente.
        // Se Vez das Brancas (Bottom), painel Bottom mostra peças Pretas capturadas.
        
        // Vamos simplificar: Container 'captured-pieces-white' contém peças BRANCAS que saíram do jogo.
        const targetContainer = piece.color === 'white' ? capturedContainerBottom : capturedContainerTop;
        
        // Correção de lógica visual baseada no tabuleiro fixo:
        // Se boardOrientation == white: Bottom = Brancas, Top = Pretas.
        // captured-pieces-top deve mostrar peças BRANCAS que as pretas capturaram? Ou peças PRETAS que as brancas capturaram?
        // Geralmente mostra o "Cemitério".
        // Vamos jogar as peças nos containers corretos baseados em ID no HTML, depois o flipBoard inverte a posição visual dos containers.
        
        // Vamos usar IDs fixos lógicos para inserção:
        // Use 'captured-pieces-bottom' para capturas feitas pelo jogador de baixo? Não, melhor usar classes de cor.
        // O código HTML tem IDs top e bottom. Vamos inferir pela cor.
        
        const img = document.createElement('div');
        img.classList.add('captured-piece');
        img.style.backgroundImage = `url('${PIECE_IMAGES_URL + pieceSvgMap[piece.color][piece.type]}')`;
        
        if (piece.color === 'white') {
            // Peça branca capturada. Onde vai? Geralmente lado do jogador preto.
            // Se orientation white, preto está em cima -> top.
            if (boardOrientation === 'white') capturedContainerTop.appendChild(img);
            else capturedContainerBottom.appendChild(img);
        } else {
            // Peça preta capturada.
            if (boardOrientation === 'white') capturedContainerBottom.appendChild(img);
            else capturedContainerTop.appendChild(img);
        }
    }
    
    function recalculateCapturedUI() {
        capturedContainerTop.innerHTML = '';
        capturedContainerBottom.innerHTML = '';
        // Contagem de peças iniciais vs atuais para reconstruir cemitério é complexa.
        // Simplesmente limpamos. Em uma versão v2, compararíamos count das peças.
    }

    function addToMoveHistory(move, check, mate) {
        const li = document.createElement('li');
        const num = Math.ceil(moveCount / 2);
        const prefix = currentPlayer === 'black' ? `${num}. ` : ''; // Se agora é black, o último foi white
        
        let san = getPieceNotation(move.piece.type);
        if (move.capturedPiece || move.isEnPassant) san += 'x';
        san += getAlgebraic(move.to);
        if (move.isCastling) san = move.to > move.from ? "O-O" : "O-O-O";
        if (mate) san += "#";
        else if (check) san += "+";

        li.textContent = prefix + san; // Simplificado
        moveHistoryElement.appendChild(li);
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    }
    
    function getPieceNotation(type) {
        if (type === 'pawn') return '';
        return {knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K'}[type];
    }
    function getAlgebraic(idx) {
        return String.fromCharCode(97 + (idx % 8)) + (8 - Math.floor(idx / 8));
    }
    function updateNotationVisibility() {
        boardContainer.classList.toggle('show-notation', showNotation);
    }
    function clearHighlights() {
        squares.forEach(s => {
            if (s) s.classList.remove('highlight', 'capture-possible', 'king-in-check', 'last-move-highlight');
        });
    }
    function highlightLastMove(from, to) {
        if (squares[from]) squares[from].classList.add('last-move-highlight');
        if (squares[to]) squares[to].classList.add('last-move-highlight');
    }

    // --- Listeners ---
    undoButton.addEventListener('click', undoLastMove);
    flipButton.addEventListener('click', flipBoard);
    toggleNotationButton.addEventListener('click', () => { showNotation = !showNotation; updateNotationVisibility(); });
    restartButton.addEventListener('click', () => { 
        gameActive = true; 
        currentPlayer = 'white'; 
        boardOrientation = 'white';
        boardState = []; 
        moveCount = 0; 
        lastMove = {from:-1}; 
        kingPositions={white:-1, black:-1}; 
        gameHistory = [];
        capturedContainerTop.innerHTML = '';
        capturedContainerBottom.innerHTML = '';
        moveHistoryElement.innerHTML = '';
        gameMessageElement.textContent = '';
        
        // Re-inicializa array lógico
        for(let i=0; i<64; i++) boardState[i] = getInitialPiece(i);
        
        createBoard();
    });

    // Start
    restartButton.click();
    setInterval(() => datetimeElement.textContent = new Date().toLocaleString('pt-BR'), 1000);
});