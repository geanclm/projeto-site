document.addEventListener('DOMContentLoaded', function () {

    // ─────────────────────────────────────────────
    //  CONSTANTES E TABELAS DE AVALIAÇÃO (IA)
    // ─────────────────────────────────────────────
    const PIECE_VALUE = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };

    // Tabelas posicionais (perspectiva das brancas; espelha para pretas)
    const PST = {
        pawn: [
             0,  0,  0,  0,  0,  0,  0,  0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
             5,  5, 10, 25, 25, 10,  5,  5,
             0,  0,  0, 20, 20,  0,  0,  0,
             5, -5,-10,  0,  0,-10, -5,  5,
             5, 10, 10,-20,-20, 10, 10,  5,
             0,  0,  0,  0,  0,  0,  0,  0
        ],
        knight: [
            -50,-40,-30,-30,-30,-30,-40,-50,
            -40,-20,  0,  0,  0,  0,-20,-40,
            -30,  0, 10, 15, 15, 10,  0,-30,
            -30,  5, 15, 20, 20, 15,  5,-30,
            -30,  0, 15, 20, 20, 15,  0,-30,
            -30,  5, 10, 15, 15, 10,  5,-30,
            -40,-20,  0,  5,  5,  0,-20,-40,
            -50,-40,-30,-30,-30,-30,-40,-50
        ],
        bishop: [
            -20,-10,-10,-10,-10,-10,-10,-20,
            -10,  0,  0,  0,  0,  0,  0,-10,
            -10,  0,  5, 10, 10,  5,  0,-10,
            -10,  5,  5, 10, 10,  5,  5,-10,
            -10,  0, 10, 10, 10, 10,  0,-10,
            -10, 10, 10, 10, 10, 10, 10,-10,
            -10,  5,  0,  0,  0,  0,  5,-10,
            -20,-10,-10,-10,-10,-10,-10,-20
        ],
        rook: [
             0,  0,  0,  0,  0,  0,  0,  0,
             5, 10, 10, 10, 10, 10, 10,  5,
            -5,  0,  0,  0,  0,  0,  0, -5,
            -5,  0,  0,  0,  0,  0,  0, -5,
            -5,  0,  0,  0,  0,  0,  0, -5,
            -5,  0,  0,  0,  0,  0,  0, -5,
            -5,  0,  0,  0,  0,  0,  0, -5,
             0,  0,  0,  5,  5,  0,  0,  0
        ],
        queen: [
            -20,-10,-10, -5, -5,-10,-10,-20,
            -10,  0,  0,  0,  0,  0,  0,-10,
            -10,  0,  5,  5,  5,  5,  0,-10,
             -5,  0,  5,  5,  5,  5,  0, -5,
              0,  0,  5,  5,  5,  5,  0, -5,
            -10,  5,  5,  5,  5,  5,  0,-10,
            -10,  0,  5,  0,  0,  0,  0,-10,
            -20,-10,-10, -5, -5,-10,-10,-20
        ],
        king: [
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -30,-40,-40,-50,-50,-40,-40,-30,
            -20,-30,-30,-40,-40,-30,-30,-20,
            -10,-20,-20,-20,-20,-20,-20,-10,
             20, 20,  0,  0,  0,  0, 20, 20,
             20, 30, 10,  0,  0, 10, 30, 20
        ]
    };

    // ─────────────────────────────────────────────
    //  CONFIGURAÇÃO / ESTADO DO JOGO
    // ─────────────────────────────────────────────
    const PIECE_IMAGES = "https://upload.wikimedia.org/wikipedia/commons/";
    const SVG = {
        white: { pawn:'4/45/Chess_plt45.svg', rook:'7/72/Chess_rlt45.svg', knight:'7/70/Chess_nlt45.svg', bishop:'b/b1/Chess_blt45.svg', queen:'1/15/Chess_qlt45.svg', king:'4/42/Chess_klt45.svg' },
        black: { pawn:'c/c7/Chess_pdt45.svg', rook:'f/ff/Chess_rdt45.svg', knight:'e/ef/Chess_ndt45.svg', bishop:'9/98/Chess_bdt45.svg', queen:'4/47/Chess_qdt45.svg', king:'f/f0/Chess_kdt45.svg' }
    };

    // DOM
    const boardEl         = document.getElementById('board');
    const capTopEl        = document.querySelector('#captured-pieces-top .captured-piece-container');
    const capBotEl        = document.querySelector('#captured-pieces-bottom .captured-piece-container');
    const capTitleTop     = document.getElementById('captured-title-top');
    const capTitleBot     = document.getElementById('captured-title-bottom');
    const scoreTop        = document.getElementById('score-top');
    const scoreBot        = document.getElementById('score-bottom');
    const datetimeEl      = document.getElementById('datetime');
    const currentPlayerEl = document.getElementById('current-player');
    const gameMsgEl       = document.getElementById('game-message');
    const moveHistEl      = document.getElementById('move-history');
    const boardContainer  = document.querySelector('.board-container');
    const promotionModal  = document.getElementById('promotion-modal');
    const thinkingOverlay = document.getElementById('thinking-overlay');

    // Botões
    const btnPvP     = document.getElementById('btn-pvp');
    const btnPvC     = document.getElementById('btn-pvc');
    const aiOptions  = document.getElementById('ai-options');
    const diffBtns   = document.querySelectorAll('.diff-btn');
    const colorBtns  = document.querySelectorAll('.color-btn');
    const undoBtn    = document.getElementById('undo-button');
    const flipBtn    = document.getElementById('flip-board-button');
    const restartBtn = document.getElementById('restart-button');
    const notationBtn= document.getElementById('toggle-notation');
    const promoBtns  = promotionModal.querySelectorAll('button');

    // Estado
    let boardState = [];
    let squares    = [];        // Indexado logicamente (0-63)
    let selected   = null;
    let currentPlayer = 'white';
    let orientation   = 'white';
    let showNotation  = false;
    let gameActive    = false;
    let kingPos       = { white: -1, black: -1 };
    let lastMove      = { from: -1, to: -1, doublePushedPawnIndex: -1 };
    let history       = [];
    let moveCount     = 0;
    let capturedByWhite = [];   // Peças pretas capturadas pelas brancas
    let capturedByBlack = [];   // Peças brancas capturadas pelas pretas

    // Configurações IA
    let vsComputer   = false;
    let aiColor      = 'black';
    let aiDepth      = 1;
    let aiThinking   = false;

    // Sons (silenciosos se não houver arquivo)
    const mkSound = src => { const a = new Audio(src); a.onerror = () => a.muted = true; return a; };
    const SND = { move: mkSound('sounds/move.mp3'), capture: mkSound('sounds/capture.mp3'), check: mkSound('sounds/check.mp3'), over: mkSound('sounds/gameover.mp3') };

    // ─────────────────────────────────────────────
    //  SETUP DE PEÇAS
    // ─────────────────────────────────────────────
    function getInitialPiece(i) {
        const types = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
        if (i >= 0  && i <= 7)  return { type: types[i],   color: 'black', hasMoved: false };
        if (i >= 8  && i <= 15) return { type: 'pawn',      color: 'black', hasMoved: false };
        if (i >= 48 && i <= 55) return { type: 'pawn',      color: 'white', hasMoved: false };
        if (i >= 56 && i <= 63) return { type: types[i-56], color: 'white', hasMoved: false };
        return null;
    }

    // ─────────────────────────────────────────────
    //  RENDERIZAÇÃO
    // ─────────────────────────────────────────────
    function createBoard() {
        boardEl.innerHTML = '';
        squares = new Array(64).fill(null);

        for (let vis = 0; vis < 64; vis++) {
            const li = orientation === 'white' ? vis : 63 - vis;
            const row = Math.floor(li / 8);
            const col = li % 8;

            const sq = document.createElement('div');
            sq.classList.add('square', (row + col) % 2 === 0 ? 'white' : 'black');
            sq.dataset.index = li;
            sq.addEventListener('click', () => handleClick(li));

            const p = boardState[li];
            if (p) renderPiece(sq, p);

            addNotation(sq, row, col);
            boardEl.appendChild(sq);
            squares[li] = sq;
        }

        updateNotationVisibility();
        applyLastMoveHighlight();
        applyCheckHighlight();
        updateUI();
    }

    function renderPiece(sq, p) {
        const d = document.createElement('div');
        d.className = 'piece';
        d.style.backgroundImage = `url('${PIECE_IMAGES}${SVG[p.color][p.type]}')`;
        sq.appendChild(d);
    }

    function addNotation(sq, row, col) {
        const isBottom = orientation === 'white' ? row === 7 : row === 0;
        const isLeft   = orientation === 'white' ? col === 0 : col === 7;
        if (isBottom) {
            const s = document.createElement('span');
            s.className = 'notation file-notation';
            s.textContent = String.fromCharCode(97 + col);
            sq.appendChild(s);
        }
        if (isLeft) {
            const s = document.createElement('span');
            s.className = 'notation rank-notation';
            s.textContent = 8 - row;
            sq.appendChild(s);
        }
    }

    function updateNotationVisibility() {
        boardContainer.classList.toggle('show-notation', showNotation);
    }

    function clearHighlights() {
        squares.forEach(s => s && s.classList.remove('highlight','capture-possible','king-in-check','last-move-highlight','selected'));
    }

    function applyLastMoveHighlight() {
        if (lastMove.from >= 0) {
            squares[lastMove.from]?.classList.add('last-move-highlight');
            squares[lastMove.to]?.classList.add('last-move-highlight');
        }
    }

    function applyCheckHighlight() {
        if (isInCheck(currentPlayer, boardState)) {
            squares[kingPos[currentPlayer]]?.classList.add('king-in-check');
        }
    }

    function updateUI() {
        currentPlayerEl.textContent = currentPlayer === 'white' ? 'Brancas' : 'Pretas';
        updateMaterialScore();
    }

    function updateMaterialScore() {
        const wVal = capturedByWhite.reduce((s, p) => s + PIECE_VALUE[p.type], 0);
        const bVal = capturedByBlack.reduce((s, p) => s + PIECE_VALUE[p.type], 0);
        const diff = wVal - bVal;
        scoreTop.textContent  = '';
        scoreBot.textContent  = '';
        if (diff > 0) scoreBot.textContent = `+${diff / 100 | 0}`;
        if (diff < 0) scoreTop.textContent = `+${(-diff) / 100 | 0}`;
    }

    function renderCaptured() {
        capTopEl.innerHTML = '';
        capBotEl.innerHTML = '';
        // Top = peças do jogador de baixo que foram capturadas (i.e., capturadas pelo oponente)
        // Convenção clássica: mostrar peças capturadas PELO jogador daquele lado
        const [topList, botList] = orientation === 'white'
            ? [capturedByBlack, capturedByWhite]   // Topo = capturas pretas (peças brancas), Bot = capturas brancas
            : [capturedByWhite, capturedByBlack];

        topList.forEach(p => capTopEl.appendChild(makeCapturedImg(p)));
        botList.forEach(p => capBotEl.appendChild(makeCapturedImg(p)));

        // Atualizar títulos
        if (orientation === 'white') {
            capTitleTop.textContent = 'Capturadas pelo Preto:';
            capTitleBot.textContent = 'Capturadas pelo Branco:';
        } else {
            capTitleTop.textContent = 'Capturadas pelo Branco:';
            capTitleBot.textContent = 'Capturadas pelo Preto:';
        }
        updateMaterialScore();
    }

    function makeCapturedImg(p) {
        const d = document.createElement('div');
        d.className = 'captured-piece';
        d.style.backgroundImage = `url('${PIECE_IMAGES}${SVG[p.color][p.type]}')`;
        return d;
    }

    // ─────────────────────────────────────────────
    //  CLIQUE E SELEÇÃO
    // ─────────────────────────────────────────────
    function handleClick(li) {
        if (!gameActive || aiThinking) return;
        if (vsComputer && currentPlayer === aiColor) return;

        const piece = boardState[li];

        if (selected === null) {
            if (piece && piece.color === currentPlayer) pickPiece(li);
        } else {
            if (selected === li) { dropPiece(); return; }

            const moves = legalMoves(selected, boardState);
            const mv    = moves.find(m => m.to === li);

            if (mv) {
                history.push(snapshot());
                applyMove(mv, boardState, true);
            } else if (piece && piece.color === currentPlayer) {
                dropPiece();
                pickPiece(li);
            } else {
                dropPiece();
            }
        }
    }

    function pickPiece(li) {
        selected = li;
        squares[li].classList.add('selected');
        legalMoves(li, boardState).forEach(m => {
            squares[m.to].classList.add('highlight');
            if (m.isCapture || m.isEnPassant) squares[m.to].classList.add('capture-possible');
        });
    }

    function dropPiece() {
        clearHighlights();
        selected = null;
        applyLastMoveHighlight();
        applyCheckHighlight();
    }

    // ─────────────────────────────────────────────
    //  EXECUÇÃO DE MOVIMENTOS
    // ─────────────────────────────────────────────
    function applyMove(mv, state, isReal = false) {
        const { from, to, isCastling, isEnPassant, isPromotion, isDoublePush } = mv;
        const piece = state[from];
        let captured = state[to] ? { ...state[to] } : null;

        state[to]   = piece;
        state[from] = null;
        piece.hasMoved = true;

        if (piece.type === 'king') kingPos[piece.color] = to;

        // Roque
        if (isCastling) {
            const row      = Math.floor(from / 8);
            const kingSide = to > from;
            const rFrom    = kingSide ? row * 8 + 7 : row * 8;
            const rTo      = kingSide ? row * 8 + 5 : row * 8 + 3;
            state[rTo]   = state[rFrom];
            state[rFrom] = null;
            if (state[rTo]) state[rTo].hasMoved = true;
        }

        // En passant
        if (isEnPassant) {
            const capIdx = to + (piece.color === 'white' ? 8 : -8);
            captured = state[capIdx] ? { ...state[capIdx] } : null;
            state[capIdx] = null;
        }

        // Atualizar doublePush para next en passant
        const dpIdx = isDoublePush ? to : -1;

        if (isReal) {
            // Registrar capturas
            if (captured) {
                if (piece.color === 'white') capturedByWhite.push(captured);
                else                          capturedByBlack.push(captured);
                SND.capture.play().catch(() => {});
            } else if (!isCastling) {
                SND.move.play().catch(() => {});
            }

            lastMove = { from, to, doublePushedPawnIndex: dpIdx };
            selected = null;
            moveCount++;

            // Promoção
            if (isPromotion) {
                clearHighlights();
                createBoard();
                renderCaptured();
                openPromotion(to, piece.color);
                return;
            }

            endTurn(from, to, mv, captured);
        } else {
            // Uso interno pela IA
            lastMove.doublePushedPawnIndex = dpIdx;
        }
    }

    function endTurn(from, to, mv, captured) {
        currentPlayer = opp(currentPlayer);
        clearHighlights();
        createBoard();
        renderCaptured();

        const inCheck = isInCheck(currentPlayer, boardState);
        const moves   = allLegalMoves(currentPlayer, boardState);
        let msg = '';

        if (moves.length === 0) {
            gameActive = false;
            SND.over.play().catch(() => {});
            msg = inCheck
                ? `XEQUE-MATE! ${opp(currentPlayer).toUpperCase()} VENCEU! 🏆`
                : 'EMPATE POR AFOGAMENTO!';
        } else if (inCheck) {
            SND.check.play().catch(() => {});
            msg = 'XEQUE!';
        }

        gameMsgEl.textContent = msg;
        addMoveHistory(mv, inCheck, moves.length === 0 && inCheck);

        if (gameActive && vsComputer && currentPlayer === aiColor) {
            triggerAI();
        }
    }

    function openPromotion(idx, color) {
        promotionModal.style.display = 'flex';
        const handler = e => {
            const type = e.currentTarget.dataset.piece;
            boardState[idx].type = type;
            promotionModal.style.display = 'none';
            promoBtns.forEach(b => b.removeEventListener('click', b._h));
            const mv = { from: lastMove.from, to: idx, isPromotion: true };
            endTurn(lastMove.from, idx, mv, null);
        };
        promoBtns.forEach(b => { b._h = handler; b.addEventListener('click', handler); });
    }

    // ─────────────────────────────────────────────
    //  GERAÇÃO DE MOVIMENTOS
    // ─────────────────────────────────────────────
    function legalMoves(idx, state) {
        const piece = state[idx];
        if (!piece) return [];
        return rawMoves(idx, piece.type, piece.color, state)
            .filter(mv => {
                const sim = cloneState(state);
                applyMoveToSim(mv, sim);
                return !isInCheck(piece.color, sim);
            });
    }

    function allLegalMoves(color, state) {
        const res = [];
        state.forEach((p, i) => { if (p && p.color === color) res.push(...legalMoves(i, state)); });
        return res;
    }

    function rawMoves(idx, type, color, state, forAttack = false) {
        const moves = [];
        const r = idx >> 3, c = idx & 7;
        const en = opp(color);

        const push = (tr, tc, opts = {}) => {
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
            const ti = tr * 8 + tc;
            const tp = state[ti];
            if (tp) {
                if (tp.color === en && !opts.moveOnly)
                    moves.push({ from: idx, to: ti, isCapture: true, isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
                return true; // bloqueado
            }
            if (!opts.captureOnly)
                moves.push({ from: idx, to: ti, isCapture: false, isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
            return false;
        };

        if (type === 'pawn') {
            const d      = color === 'white' ? -1 : 1;
            const start  = color === 'white' ? 6 : 1;
            if (!forAttack) {
                if (!state[(r + d) * 8 + c]) {
                    push(r + d, c, { moveOnly: true });
                    if (r === start && !state[(r + d * 2) * 8 + c])
                        moves.push({ from: idx, to: (r + d * 2) * 8 + c, isDoublePush: true });
                }
            }
            [-1, 1].forEach(dc => {
                const tr = r + d, tc = c + dc;
                if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
                    if (forAttack) {
                        moves.push({ from: idx, to: tr * 8 + tc, isCapture: true });
                    } else {
                        push(tr, tc, { captureOnly: true });
                        // En passant
                        if (lastMove.doublePushedPawnIndex === r * 8 + tc)
                            moves.push({ from: idx, to: tr * 8 + tc, isCapture: true, isEnPassant: true });
                    }
                }
            });
        } else if (type === 'knight') {
            [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => push(r+dr,c+dc));
        } else if (type === 'king') {
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => push(r+dr,c+dc));
            // Roque
            if (!forAttack && !state[idx].hasMoved && !isInCheck(color, state)) {
                const row = r;
                // Kingside
                const ksRook = state[row * 8 + 7];
                if (ksRook && ksRook.type === 'rook' && !ksRook.hasMoved &&
                    !state[row*8+5] && !state[row*8+6] &&
                    !isAttacked(row*8+5, en, state) && !isAttacked(row*8+6, en, state))
                    moves.push({ from: idx, to: row*8+6, isCastling: true });
                // Queenside
                const qsRook = state[row * 8];
                if (qsRook && qsRook.type === 'rook' && !qsRook.hasMoved &&
                    !state[row*8+1] && !state[row*8+2] && !state[row*8+3] &&
                    !isAttacked(row*8+3, en, state) && !isAttacked(row*8+2, en, state))
                    moves.push({ from: idx, to: row*8+2, isCastling: true });
            }
        } else {
            const dirs = [];
            if (type !== 'bishop') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
            if (type !== 'rook')   dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
            dirs.forEach(([dr,dc]) => {
                let tr = r+dr, tc = c+dc;
                while (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
                    if (push(tr, tc)) break;
                    tr += dr; tc += dc;
                }
            });
        }
        return moves;
    }

    function isAttacked(idx, attackerColor, state) {
        return state.some((p, i) => p && p.color === attackerColor &&
            rawMoves(i, p.type, p.color, state, true).some(m => m.to === idx));
    }

    function isInCheck(color, state) {
        const kp = state.findIndex(p => p && p.type === 'king' && p.color === color);
        return kp >= 0 && isAttacked(kp, opp(color), state);
    }

    // ─────────────────────────────────────────────
    //  SIMULAÇÃO (IA e legalidade)
    // ─────────────────────────────────────────────
    function cloneState(state) {
        return state.map(p => p ? { ...p } : null);
    }

    function applyMoveToSim(mv, state) {
        const { from, to, isCastling, isEnPassant, isDoublePush } = mv;
        const piece = state[from];
        state[to]   = piece;
        state[from] = null;
        if (piece) { piece.hasMoved = true; if (piece.type === 'king') kingPos[piece.color] = to; }

        if (isCastling) {
            const row = from >> 3, ks = to > from;
            const rF = ks ? row*8+7 : row*8, rT = ks ? row*8+5 : row*8+3;
            state[rT] = state[rF]; state[rF] = null;
            if (state[rT]) state[rT].hasMoved = true;
        }
        if (isEnPassant) {
            state[to + (state[to].color === 'white' ? 8 : -8)] = null;
        }
        lastMove.doublePushedPawnIndex = isDoublePush ? to : -1;
    }

    // ─────────────────────────────────────────────
    //  INTELIGÊNCIA ARTIFICIAL  —  Minimax + Alpha-Beta
    // ─────────────────────────────────────────────
    function triggerAI() {
        if (!gameActive) return;
        aiThinking = true;
        thinkingOverlay.classList.remove('hidden');

        setTimeout(() => {
            const savedDP = lastMove.doublePushedPawnIndex;
            const mv = findBestMove(boardState, aiColor, aiDepth);
            lastMove.doublePushedPawnIndex = savedDP; // Restaurar para applyMove real
            thinkingOverlay.classList.add('hidden');
            aiThinking = false;

            if (mv) {
                history.push(snapshot());
                applyMove(mv, boardState, true);
            }
        }, 50); // Pequeno delay para o overlay aparecer
    }

    function findBestMove(state, color, depth) {
        const moves = orderMoves(allLegalMoves(color, state), state);
        if (!moves.length) return null;

        let best = null, bestScore = -Infinity;
        const savedDP = lastMove.doublePushedPawnIndex;

        for (const mv of moves) {
            const sim = cloneState(state);
            const prevDP = lastMove.doublePushedPawnIndex;
            applyMoveToSim(mv, sim);
            const score = -negamax(sim, depth - 1, -Infinity, Infinity, opp(color));
            lastMove.doublePushedPawnIndex = prevDP;

            if (score > bestScore) { bestScore = score; best = mv; }
        }
        lastMove.doublePushedPawnIndex = savedDP;
        return best;
    }

    function negamax(state, depth, alpha, beta, color) {
        if (depth === 0) return evaluate(state, color);
        const moves = orderMoves(allLegalMoves(color, state), state);
        if (!moves.length) {
            return isInCheck(color, state) ? -50000 - depth : 0; // Mate ou Stalemate
        }
        let best = -Infinity;
        for (const mv of moves) {
            const sim = cloneState(state);
            const prevDP = lastMove.doublePushedPawnIndex;
            applyMoveToSim(mv, sim);
            const score = -negamax(sim, depth - 1, -beta, -alpha, opp(color));
            lastMove.doublePushedPawnIndex = prevDP;
            best = Math.max(best, score);
            alpha = Math.max(alpha, score);
            if (alpha >= beta) break; // Poda alfa-beta
        }
        return best;
    }

    // Ordenação: capturas > promoções > outros (melhora poda)
    function orderMoves(moves, state) {
        return moves.sort((a, b) => {
            const scoreMove = mv => {
                let s = 0;
                if (mv.isCapture) {
                    const cap = state[mv.to];
                    if (cap) s += PIECE_VALUE[cap.type];
                }
                if (mv.isPromotion) s += PIECE_VALUE.queen;
                return s;
            };
            return scoreMove(b) - scoreMove(a);
        });
    }

    function evaluate(state, color) {
        let score = 0;
        state.forEach((p, i) => {
            if (!p) return;
            const base = PIECE_VALUE[p.type];
            const pstIdx = p.color === 'white' ? i : 63 - i;
            const pos    = PST[p.type] ? PST[p.type][pstIdx] : 0;
            const val    = base + pos;
            score += p.color === color ? val : -val;
        });
        return score;
    }

    // ─────────────────────────────────────────────
    //  DESFAZER
    // ─────────────────────────────────────────────
    function snapshot() {
        return {
            boardState:     cloneState(boardState),
            currentPlayer,
            kingPos:        { ...kingPos },
            lastMove:       { ...lastMove },
            moveCount,
            gameActive,
            capturedByWhite: [...capturedByWhite],
            capturedByBlack: [...capturedByBlack]
        };
    }

    function undo() {
        // Se vs IA, precisamos desfazer 2 movimentos (jogada do humano + resposta da IA)
        const steps = (vsComputer && history.length >= 2) ? 2 : 1;
        for (let i = 0; i < steps && history.length; i++) {
            const prev = history.pop();
            boardState      = prev.boardState;
            currentPlayer   = prev.currentPlayer;
            kingPos         = prev.kingPos;
            lastMove        = prev.lastMove;
            moveCount       = prev.moveCount;
            gameActive      = prev.gameActive;
            capturedByWhite = prev.capturedByWhite;
            capturedByBlack = prev.capturedByBlack;
            moveCount--;
            if (moveHistEl.lastChild) moveHistEl.lastChild.remove();
        }
        selected = null;
        gameMsgEl.textContent = '';
        clearHighlights();
        createBoard();
        renderCaptured();
    }

    // ─────────────────────────────────────────────
    //  HISTÓRICO DE MOVIMENTOS (SAN simplificado)
    // ─────────────────────────────────────────────
    function addMoveHistory(mv, check, mate) {
        const li = document.createElement('li');
        const num = Math.ceil(moveCount / 2);
        const isWhiteMove = currentPlayer === 'black'; // Acabou de jogar brancas
        let san = mv.isCastling
            ? (mv.to > mv.from ? 'O-O' : 'O-O-O')
            : (pieceNotation(mv.piece?.type || '') + (mv.isCapture || mv.isEnPassant ? 'x' : '') + algebraic(mv.to));
        if (mv.isPromotion) san += '=Q';
        if (mate)  san += '#';
        else if (check) san += '+';
        li.textContent = isWhiteMove ? `${num}. ${san}` : `   ${san}`;
        li.style.fontWeight = isWhiteMove ? 'bold' : 'normal';
        moveHistEl.appendChild(li);
        moveHistEl.scrollTop = moveHistEl.scrollHeight;
    }

    function pieceNotation(t) { return { pawn:'', knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K' }[t] ?? ''; }
    function algebraic(i)      { return String.fromCharCode(97 + (i & 7)) + (8 - (i >> 3)); }

    // ─────────────────────────────────────────────
    //  UTILITÁRIOS
    // ─────────────────────────────────────────────
    function opp(c) { return c === 'white' ? 'black' : 'white'; }

    // ─────────────────────────────────────────────
    //  INICIALIZAÇÃO / REINÍCIO
    // ─────────────────────────────────────────────
    function initGame() {
        boardState      = Array.from({ length: 64 }, (_, i) => getInitialPiece(i));
        currentPlayer   = 'white';
        selected        = null;
        gameActive      = true;
        aiThinking      = false;
        moveCount       = 0;
        history         = [];
        capturedByWhite = [];
        capturedByBlack = [];
        lastMove        = { from: -1, to: -1, doublePushedPawnIndex: -1 };
        kingPos         = { white: 60, black: 4 };
        gameMsgEl.textContent  = '';
        moveHistEl.innerHTML   = '';
        capTopEl.innerHTML     = '';
        capBotEl.innerHTML     = '';
        scoreTop.textContent   = '';
        scoreBot.textContent   = '';

        createBoard();

        // Se IA joga de brancas, começa imediatamente
        if (vsComputer && aiColor === 'white') triggerAI();
    }

    // ─────────────────────────────────────────────
    //  EVENT LISTENERS — Controles e Configurações
    // ─────────────────────────────────────────────

    // Modo PvP / PvC
    btnPvP.addEventListener('click', () => {
        vsComputer = false;
        btnPvP.classList.add('active'); btnPvC.classList.remove('active');
        aiOptions.classList.add('hidden');
        initGame();
    });
    btnPvC.addEventListener('click', () => {
        vsComputer = true;
        btnPvC.classList.add('active'); btnPvP.classList.remove('active');
        aiOptions.classList.remove('hidden');
        initGame();
    });

    // Dificuldade
    diffBtns.forEach(b => b.addEventListener('click', () => {
        diffBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        aiDepth = parseInt(b.dataset.depth);
        initGame();
    }));

    // Cor do jogador
    colorBtns.forEach(b => b.addEventListener('click', () => {
        colorBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        aiColor     = opp(b.dataset.color);
        orientation = b.dataset.color; // Jogador humano embaixo
        initGame();
    }));

    undoBtn.addEventListener('click', undo);
    flipBtn.addEventListener('click', () => { orientation = opp(orientation); createBoard(); renderCaptured(); });
    restartBtn.addEventListener('click', initGame);
    notationBtn.addEventListener('click', () => { showNotation = !showNotation; updateNotationVisibility(); });

    // ─────────────────────────────────────────────
    //  START
    // ─────────────────────────────────────────────
    setInterval(() => datetimeEl.textContent = new Date().toLocaleString('pt-BR'), 1000);
    initGame();
});
