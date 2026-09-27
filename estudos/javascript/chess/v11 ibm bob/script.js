/**
 * Chess XI · IBM Bob
 * Improvements over v10:
 *  • Per-side countdown timer (10 min, configurable)
 *  • Proper board coordinate labels (rank/file) that update on flip
 *  • Promotion modal shows actual piece SVGs
 *  • Game-over modal (trophy + message) instead of plain text
 *  • Move history stored as paired rows (white + black in one row)
 *  • SAN notation includes piece disambiguation
 *  • Stalemate / 50-move / insufficient-material draw detection
 *  • Threefold repetition detection
 *  • AI runs on a Web Worker via inline Blob — never blocks UI
 *  • Depth 4 "Mestre" difficulty option
 *  • Timer pauses when AI is thinking
 *  • Full keyboard shortcuts: N=new, F=flip, Ctrl+Z=undo
 *  • ARIA live regions for accessibility
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ═══════════════════════════════════════════════
     PIECE SVG URLS (Wikimedia Commons)
  ═══════════════════════════════════════════════ */
  const BASE = 'https://upload.wikimedia.org/wikipedia/commons/';
  const SVG = {
    white: {
      pawn:   BASE + '4/45/Chess_plt45.svg',
      rook:   BASE + '7/72/Chess_rlt45.svg',
      knight: BASE + '7/70/Chess_nlt45.svg',
      bishop: BASE + 'b/b1/Chess_blt45.svg',
      queen:  BASE + '1/15/Chess_qlt45.svg',
      king:   BASE + '4/42/Chess_klt45.svg',
    },
    black: {
      pawn:   BASE + 'c/c7/Chess_pdt45.svg',
      rook:   BASE + 'f/ff/Chess_rdt45.svg',
      knight: BASE + 'e/ef/Chess_ndt45.svg',
      bishop: BASE + '9/98/Chess_bdt45.svg',
      queen:  BASE + '4/47/Chess_qdt45.svg',
      king:   BASE + 'f/f0/Chess_kdt45.svg',
    },
  };

  /* ═══════════════════════════════════════════════
     PIECE VALUES & POSITION TABLES (AI)
  ═══════════════════════════════════════════════ */
  const VAL = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };

  const PST = {
    pawn: [
       0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0,
    ],
    knight: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50,
    ],
    bishop: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20,
    ],
    rook: [
       0,  0,  0,  0,  0,  0,  0,  0,
       5, 10, 10, 10, 10, 10, 10,  5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
      -5,  0,  0,  0,  0,  0,  0, -5,
       0,  0,  0,  5,  5,  0,  0,  0,
    ],
    queen: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20,
    ],
    king: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20,
    ],
    kingEnd: [
      -50,-40,-30,-20,-20,-30,-40,-50,
      -30,-20,-10,  0,  0,-10,-20,-30,
      -30,-10, 20, 30, 30, 20,-10,-30,
      -30,-10, 30, 40, 40, 30,-10,-30,
      -30,-10, 30, 40, 40, 30,-10,-30,
      -30,-10, 20, 30, 30, 20,-10,-30,
      -30,-30,  0,  0,  0,  0,-30,-30,
      -50,-30,-30,-30,-30,-30,-30,-50,
    ],
  };

  /* ═══════════════════════════════════════════════
     DOM REFERENCES
  ═══════════════════════════════════════════════ */
  const boardEl        = document.getElementById('board');
  const rankLabelsEl   = document.getElementById('rank-labels');
  const fileLabelsEl   = document.getElementById('file-labels');
  const capTopEl       = document.getElementById('cap-top');
  const capBotEl       = document.getElementById('cap-bot');
  const scoreTopEl     = document.getElementById('score-top');
  const scoreBotEl     = document.getElementById('score-bot');
  const datetimeEl     = document.getElementById('datetime');
  const playerBadge    = document.getElementById('current-player');
  const msgEl          = document.getElementById('game-message');
  const moveHistEl     = document.getElementById('move-history');
  const thinkingEl     = document.getElementById('thinking-overlay');
  const timerWhiteEl   = document.getElementById('timer-white-val');
  const timerBlackEl   = document.getElementById('timer-black-val');
  const timerWhiteBlk  = document.getElementById('timer-white');
  const timerBlackBlk  = document.getElementById('timer-black');

  // Buttons
  const btnPvP       = document.getElementById('btn-pvp');
  const btnPvC       = document.getElementById('btn-pvc');
  const aiOptionsEl  = document.getElementById('ai-options');
  const diffBtns     = document.querySelectorAll('.diff-btn');
  const colorBtns    = document.querySelectorAll('.color-btn');
  const undoBtn      = document.getElementById('undo-button');
  const flipBtn      = document.getElementById('flip-board-button');
  const restartBtn   = document.getElementById('restart-button');
  const notationBtn  = document.getElementById('toggle-notation');
  const saveHistBtn  = document.getElementById('save-history-btn');

  // Promotion modal
  const promoModal   = document.getElementById('promotion-modal');
  const promoBtns    = promoModal.querySelectorAll('.promo-btn');

  // Game over modal
  const gameoverModal = document.getElementById('gameover-modal');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverMsg   = document.getElementById('gameover-msg');
  const gameoverIcon  = document.getElementById('gameover-icon');
  const gameoverRestart = document.getElementById('gameover-restart');

  /* ═══════════════════════════════════════════════
     GAME STATE
  ═══════════════════════════════════════════════ */
  let boardState    = [];   // 64 entries: null | {type, color, hasMoved}
  let sqEls         = [];   // 64 DOM elements indexed logically
  let selected      = null;
  let currentPlayer = 'white';
  let orientation   = 'white';
  let showNotation  = false;
  let gameActive    = false;
  let kingPos       = { white: 60, black: 4 };
  let lastMove      = { from: -1, to: -1, dpIdx: -1 }; // dpIdx = double-push pawn index
  let history       = [];   // snapshots for undo
  let halfMoves     = 0;    // for 50-move rule
  let positionHashes= [];   // for threefold repetition
  let moveCount     = 0;

  let capturedByWhite = []; // black pieces captured by white
  let capturedByBlack = []; // white pieces captured by black

  // Timers (seconds)
  const TIMER_START = 10 * 60;
  let timers      = { white: TIMER_START, black: TIMER_START };
  let timerTick   = null;

  // AI
  let vsComputer  = false;
  let aiColor     = 'black';
  let aiDepth     = 1;
  let aiWorker    = null;
  let aiThinking  = false;

  // Paired move history rows
  let moveRows = []; // [{num, white: sanStr, black: sanStr|null, el}]

  /* ═══════════════════════════════════════════════
     SOUNDS (silent graceful fallback)
  ═══════════════════════════════════════════════ */
  function mkAudio(src) {
    const a = new Audio(src);
    a.onerror = () => { a.muted = true; };
    return a;
  }
  const SND = {
    move:    mkAudio('sounds/move.mp3'),
    capture: mkAudio('sounds/capture.mp3'),
    check:   mkAudio('sounds/check.mp3'),
    castle:  mkAudio('sounds/castle.mp3'),
    over:    mkAudio('sounds/gameover.mp3'),
    promote: mkAudio('sounds/promote.mp3'),
  };
  function play(snd) { try { snd.currentTime = 0; snd.play().catch(() => {}); } catch(_) {} }

  /* ═══════════════════════════════════════════════
     INITIAL PIECE SETUP
  ═══════════════════════════════════════════════ */
  const BACK_ROW = ['rook','knight','bishop','queen','king','bishop','knight','rook'];

  function getInitialPiece(i) {
    if (i >= 0  && i <= 7)  return { type: BACK_ROW[i],     color: 'black', hasMoved: false };
    if (i >= 8  && i <= 15) return { type: 'pawn',           color: 'black', hasMoved: false };
    if (i >= 48 && i <= 55) return { type: 'pawn',           color: 'white', hasMoved: false };
    if (i >= 56 && i <= 63) return { type: BACK_ROW[i - 56], color: 'white', hasMoved: false };
    return null;
  }

  /* ═══════════════════════════════════════════════
     BOARD RENDERING
  ═══════════════════════════════════════════════ */
  function buildBoard() {
    boardEl.innerHTML = '';
    sqEls = new Array(64).fill(null);

    for (let vis = 0; vis < 64; vis++) {
      const li  = orientation === 'white' ? vis : 63 - vis;
      const row = li >> 3;
      const col = li & 7;

      const sq = document.createElement('div');
      sq.classList.add('square', (row + col) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.idx = li;
      sq.setAttribute('role', 'gridcell');
      sq.addEventListener('click', () => onClick(li));

      const p = boardState[li];
      if (p) sq.appendChild(mkPieceEl(p));

      boardEl.appendChild(sq);
      sqEls[li] = sq;
    }

    buildAxisLabels();
    applyLastMoveHL();
    applyCheckHL();
    updatePlayerBadge();
    renderCaptured();
  }

  function mkPieceEl(p) {
    const d = document.createElement('div');
    d.className = 'piece';
    d.style.backgroundImage = `url('${SVG[p.color][p.type]}')`;
    d.setAttribute('aria-label', `${p.color === 'white' ? 'Branca' : 'Preta'} ${pieceNamePT(p.type)}`);
    return d;
  }

  function buildAxisLabels() {
    rankLabelsEl.innerHTML = '';
    fileLabelsEl.innerHTML = '';

    const ranks = orientation === 'white'
      ? ['8','7','6','5','4','3','2','1']
      : ['1','2','3','4','5','6','7','8'];
    const files = orientation === 'white'
      ? ['a','b','c','d','e','f','g','h']
      : ['h','g','f','e','d','c','b','a'];

    ranks.forEach(r => {
      const s = document.createElement('div');
      s.className = 'rank-label-item';
      s.textContent = r;
      rankLabelsEl.appendChild(s);
    });
    files.forEach(f => {
      const s = document.createElement('div');
      s.className = 'file-label-item';
      s.textContent = f;
      fileLabelsEl.appendChild(s);
    });
  }

  function clearHighlights() {
    sqEls.forEach(s => s && s.classList.remove('selected','hint','can-capture','king-check','last-move'));
  }

  function applyLastMoveHL() {
    if (lastMove.from >= 0) {
      sqEls[lastMove.from]?.classList.add('last-move');
      sqEls[lastMove.to]?.classList.add('last-move');
    }
  }

  function applyCheckHL() {
    if (isInCheck(currentPlayer, boardState)) {
      sqEls[kingPos[currentPlayer]]?.classList.add('king-check');
    }
  }

  function updatePlayerBadge() {
    const isWhite = currentPlayer === 'white';
    playerBadge.textContent = isWhite ? 'Brancas' : 'Pretas';
    playerBadge.className   = 'player-badge ' + (isWhite ? 'white-badge' : 'black-badge');
  }

  function renderCaptured() {
    capTopEl.innerHTML = '';
    capBotEl.innerHTML = '';

    // If orientation white: top = black's captures (white pieces), bot = white's captures (black pieces)
    const topList = orientation === 'white' ? capturedByBlack : capturedByWhite;
    const botList = orientation === 'white' ? capturedByWhite : capturedByBlack;

    topList.forEach(p => capTopEl.appendChild(mkCapturedEl(p)));
    botList.forEach(p => capBotEl.appendChild(mkCapturedEl(p)));

    updateMaterialScore();
  }

  function mkCapturedEl(p) {
    const d = document.createElement('div');
    d.className = 'captured-piece';
    d.style.backgroundImage = `url('${SVG[p.color][p.type]}')`;
    return d;
  }

  function updateMaterialScore() {
    const wVal = capturedByWhite.reduce((s, p) => s + VAL[p.type], 0);
    const bVal = capturedByBlack.reduce((s, p) => s + VAL[p.type], 0);
    const diff = wVal - bVal;
    scoreTopEl.textContent = '';
    scoreBotEl.textContent = '';
    const lead = Math.round(Math.abs(diff) / 100);
    if (lead > 0) {
      if (orientation === 'white') {
        if (diff > 0) scoreBotEl.textContent = `+${lead}`;
        else          scoreTopEl.textContent = `+${lead}`;
      } else {
        if (diff > 0) scoreTopEl.textContent = `+${lead}`;
        else          scoreBotEl.textContent = `+${lead}`;
      }
    }
  }

  /* ═══════════════════════════════════════════════
     CLICK HANDLING
  ═══════════════════════════════════════════════ */
  function onClick(li) {
    if (!gameActive || aiThinking) return;
    if (vsComputer && currentPlayer === aiColor) return;

    const piece = boardState[li];

    if (selected === null) {
      if (piece && piece.color === currentPlayer) selectPiece(li);
    } else {
      if (selected === li) { deselectPiece(); return; }

      const moves = legalMoves(selected, boardState);
      const mv    = moves.find(m => m.to === li);

      if (mv) {
        history.push(takeSnapshot());
        execMove(mv, boardState, true);
      } else if (piece && piece.color === currentPlayer) {
        deselectPiece();
        selectPiece(li);
      } else {
        deselectPiece();
      }
    }
  }

  function selectPiece(li) {
    selected = li;
    sqEls[li].classList.add('selected');
    legalMoves(li, boardState).forEach(m => {
      sqEls[m.to].classList.add('hint');
      if (m.isCapture || m.isEnPassant) sqEls[m.to].classList.add('can-capture');
    });
  }

  function deselectPiece() {
    clearHighlights();
    selected = null;
    applyLastMoveHL();
    applyCheckHL();
  }

  /* ═══════════════════════════════════════════════
     MOVE EXECUTION
  ═══════════════════════════════════════════════ */
  function execMove(mv, state, isReal = false) {
    const { from, to, isCastling, isEnPassant, isPromotion, isDoublePush } = mv;
    const piece = state[from];
    let captured = state[to] ? { ...state[to] } : null;

    state[to]   = { ...piece };
    state[from] = null;
    state[to].hasMoved = true;

    if (piece.type === 'king') kingPos[piece.color] = to;

    if (isCastling) {
      const row = from >> 3, ks = to > from;
      const rF = ks ? row * 8 + 7 : row * 8;
      const rT = ks ? row * 8 + 5 : row * 8 + 3;
      state[rT]   = { ...state[rF], hasMoved: true };
      state[rF]   = null;
    }

    if (isEnPassant) {
      const capIdx = to + (piece.color === 'white' ? 8 : -8);
      captured = state[capIdx] ? { ...state[capIdx] } : null;
      state[capIdx] = null;
    }

    const dpIdx = isDoublePush ? to : -1;

    if (isReal) {
      // Track captures
      if (captured) {
        if (piece.color === 'white') capturedByWhite.push(captured);
        else                          capturedByBlack.push(captured);
        play(SND.capture);
      } else if (isCastling) {
        play(SND.castle);
      } else {
        play(SND.move);
      }

      halfMoves = (captured || piece.type === 'pawn') ? 0 : halfMoves + 1;
      lastMove  = { from, to, dpIdx };
      selected  = null;
      moveCount++;

      if (isPromotion) {
        clearHighlights();
        buildBoard();
        renderCaptured();
        openPromotion(to, piece.color, mv);
        return;
      }

      finishTurn(mv, captured);
    } else {
      lastMove.dpIdx = dpIdx;
    }
  }

  function finishTurn(mv, captured) {
    currentPlayer = opp(currentPlayer);
    clearHighlights();
    buildBoard();
    renderCaptured();

    // Record position for threefold repetition
    positionHashes.push(hashPosition(boardState, currentPlayer));

    // Timer
    updateTimerActive();

    const inCheck = isInCheck(currentPlayer, boardState);
    const moves   = allLegalMoves(currentPlayer, boardState);

    // Check draw conditions
    const drawReason = checkDrawConditions(currentPlayer, boardState, moves);

    if (moves.length === 0) {
      gameActive = false;
      stopTimer();
      play(SND.over);
      if (inCheck) {
        const winner = opp(currentPlayer);
        showGameOver('🏆', `${winner === 'white' ? 'Brancas' : 'Pretas'} vencem!`, 'Xeque-mate!');
        setMsg('XEQUE-MATE! ' + (winner === 'white' ? 'BRANCAS' : 'PRETAS') + ' VENCEM! 🏆', 'mate');
      } else {
        showGameOver('🤝', 'Empate!', 'Afogamento — sem movimentos legais.');
        setMsg('AFOGAMENTO — EMPATE!', 'draw');
      }
    } else if (drawReason) {
      gameActive = false;
      stopTimer();
      showGameOver('🤝', 'Empate!', drawReason);
      setMsg('EMPATE — ' + drawReason.toUpperCase(), 'draw');
    } else if (inCheck) {
      play(SND.check);
      setMsg('XEQUE!', 'check');
    } else {
      setMsg('');
    }

    addMoveHistoryRow(mv, inCheck, moves.length === 0 && inCheck);

    if (gameActive && vsComputer && currentPlayer === aiColor) {
      startAI();
    }
  }

  /* ═══════════════════════════════════════════════
     DRAW CONDITIONS
  ═══════════════════════════════════════════════ */
  function checkDrawConditions(color, state, legalMvs) {
    if (halfMoves >= 100) return 'Regra dos 50 movimentos';
    if (isInsufficientMaterial(state)) return 'Material insuficiente';
    if (checkThreefold()) return 'Repetição tripla';
    return null;
  }

  function isInsufficientMaterial(state) {
    const pieces = state.filter(Boolean);
    if (pieces.length === 2) return true; // K vs K
    if (pieces.length === 3) {
      const minor = pieces.find(p => p.type === 'bishop' || p.type === 'knight');
      if (minor) return true; // K+minor vs K
    }
    if (pieces.length === 4) {
      const bishopIndices = state.reduce((acc, p, i) => { if (p?.type === 'bishop') acc.push(i); return acc; }, []);
      if (bishopIndices.length === 2) {
        const b0c = state[bishopIndices[0]].color;
        const b1c = state[bishopIndices[1]].color;
        if (b0c !== b1c) {
          // K+B vs K+B — draw if bishops on same color square
          const sq0 = ((bishopIndices[0] >> 3) + (bishopIndices[0] & 7)) % 2;
          const sq1 = ((bishopIndices[1] >> 3) + (bishopIndices[1] & 7)) % 2;
          if (sq0 === sq1) return true;
        }
      }
    }
    return false;
  }

  function hashPosition(state, cp) {
    return cp + '|' + state.map(p => p ? `${p.color[0]}${p.type[0]}${p.hasMoved?1:0}` : '0').join('');
  }

  function checkThreefold() {
    const h = hashPosition(boardState, currentPlayer);
    const count = positionHashes.filter(x => x === h).length;
    return count >= 3;
  }

  /* ═══════════════════════════════════════════════
     PROMOTION
  ═══════════════════════════════════════════════ */
  function openPromotion(idx, color, originalMv) {
    // Set SVG backgrounds on promo icons
    promoModal.querySelector('#promo-queen').style.backgroundImage  = `url('${SVG[color].queen}')`;
    promoModal.querySelector('#promo-rook').style.backgroundImage   = `url('${SVG[color].rook}')`;
    promoModal.querySelector('#promo-bishop').style.backgroundImage = `url('${SVG[color].bishop}')`;
    promoModal.querySelector('#promo-knight').style.backgroundImage = `url('${SVG[color].knight}')`;

    promoModal.style.display = 'flex';

    function handlePromo(e) {
      const type = e.currentTarget.dataset.piece;
      boardState[idx] = { ...boardState[idx], type };
      promoModal.style.display = 'none';
      promoBtns.forEach(b => b.removeEventListener('click', b._ph));
      play(SND.promote);
      const mv = { ...originalMv, promotedTo: type };
      finishTurn(mv, null);
    }

    promoBtns.forEach(b => { b._ph = handlePromo; b.addEventListener('click', handlePromo); });
  }

  /* ═══════════════════════════════════════════════
     MOVE GENERATION
  ═══════════════════════════════════════════════ */
  function legalMoves(idx, state) {
    const piece = state[idx];
    if (!piece) return [];
    return rawMoves(idx, piece, state, false).filter(mv => {
      const sim = cloneState(state);
      applyMoveSim(mv, sim);
      return !isInCheck(piece.color, sim);
    });
  }

  function allLegalMoves(color, state) {
    const res = [];
    state.forEach((p, i) => { if (p && p.color === color) res.push(...legalMoves(i, state)); });
    return res;
  }

  function rawMoves(idx, piece, state, forAttack) {
    const moves = [];
    const { type, color } = piece;
    const r = idx >> 3, c = idx & 7;
    const enemy = opp(color);

    const add = (tr, tc, opts = {}) => {
      if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return true; // out of bounds = blocked
      const ti = tr * 8 + tc;
      const tp = state[ti];
      if (tp) {
        if (tp.color === enemy && !opts.moveOnly) {
          moves.push({ from: idx, to: ti, isCapture: true,
            isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
        }
        return true; // blocked
      }
      if (!opts.captureOnly) {
        moves.push({ from: idx, to: ti, isCapture: false,
          isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
      }
      return false;
    };

    if (type === 'pawn') {
      const d     = color === 'white' ? -1 : 1;
      const start = color === 'white' ? 6 : 1;
      if (!forAttack) {
        if (r + d >= 0 && r + d <= 7 && !state[(r + d) * 8 + c]) {
          add(r + d, c, { moveOnly: true });
          if (r === start && !state[(r + 2 * d) * 8 + c])
            moves.push({ from: idx, to: (r + 2 * d) * 8 + c, isDoublePush: true, isCapture: false,
              isPromotion: false });
        }
      }
      [-1, 1].forEach(dc => {
        const tr = r + d, tc = c + dc;
        if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return;
        if (forAttack) {
          moves.push({ from: idx, to: tr * 8 + tc, isCapture: true, isPromotion: type === 'pawn' && (tr === 0 || tr === 7) });
        } else {
          add(tr, tc, { captureOnly: true });
          // En passant
          if (lastMove.dpIdx === r * 8 + tc) {
            moves.push({ from: idx, to: tr * 8 + tc, isCapture: true, isEnPassant: true,
              isPromotion: false });
          }
        }
      });
    } else if (type === 'knight') {
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => add(r+dr,c+dc));
    } else if (type === 'king') {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => add(r+dr,c+dc));
      if (!forAttack && !piece.hasMoved && !isInCheck(color, state)) {
        // Kingside
        const ksR = state[r * 8 + 7];
        if (ksR?.type === 'rook' && !ksR.hasMoved &&
            !state[r*8+5] && !state[r*8+6] &&
            !isAttacked(r*8+5, enemy, state) && !isAttacked(r*8+6, enemy, state))
          moves.push({ from: idx, to: r*8+6, isCastling: true, isCapture: false, isPromotion: false });
        // Queenside
        const qsR = state[r * 8];
        if (qsR?.type === 'rook' && !qsR.hasMoved &&
            !state[r*8+1] && !state[r*8+2] && !state[r*8+3] &&
            !isAttacked(r*8+3, enemy, state) && !isAttacked(r*8+2, enemy, state))
          moves.push({ from: idx, to: r*8+2, isCastling: true, isCapture: false, isPromotion: false });
      }
    } else {
      const dirs = [];
      if (type !== 'bishop') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      if (type !== 'rook')   dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      dirs.forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          if (add(tr, tc)) break;
          tr += dr; tc += dc;
        }
      });
    }
    return moves;
  }

  function isAttacked(idx, attackerColor, state) {
    return state.some((p, i) =>
      p && p.color === attackerColor &&
      rawMoves(i, p, state, true).some(m => m.to === idx)
    );
  }

  function isInCheck(color, state) {
    const kIdx = state.findIndex(p => p?.type === 'king' && p.color === color);
    return kIdx >= 0 && isAttacked(kIdx, opp(color), state);
  }

  /* ═══════════════════════════════════════════════
     SIMULATION HELPERS
  ═══════════════════════════════════════════════ */
  function cloneState(state) {
    return state.map(p => p ? { ...p } : null);
  }

  function applyMoveSim(mv, state) {
    const { from, to, isCastling, isEnPassant, isDoublePush } = mv;
    const piece = state[from];
    if (!piece) return;
    state[to]   = { ...piece, hasMoved: true };
    state[from] = null;
    if (piece.type === 'king') kingPos[piece.color] = to;

    if (isCastling) {
      const row = from >> 3, ks = to > from;
      const rF = ks ? row*8+7 : row*8, rT = ks ? row*8+5 : row*8+3;
      if (state[rF]) { state[rT] = { ...state[rF], hasMoved: true }; state[rF] = null; }
    }
    if (isEnPassant) {
      const capIdx = to + (state[to].color === 'white' ? 8 : -8);
      state[capIdx] = null;
    }
    lastMove.dpIdx = isDoublePush ? to : -1;
  }

  /* ═══════════════════════════════════════════════
     AI — MINIMAX + ALPHA-BETA (Web Worker via Blob)
  ═══════════════════════════════════════════════ */
  const WORKER_SRC = `
    /* ── AI Worker ── */
    const VAL = ${JSON.stringify(VAL)};
    const PST = ${JSON.stringify(PST)};

    function opp(c) { return c === 'white' ? 'black' : 'white'; }

    function rawMovesW(idx, piece, state, lastDpIdx, forAttack) {
      const moves = [];
      const { type, color } = piece;
      const r = idx >> 3, c = idx & 7;
      const enemy = opp(color);

      const add = (tr, tc, opts = {}) => {
        if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return true;
        const ti = tr * 8 + tc;
        const tp = state[ti];
        if (tp) {
          if (tp.color === enemy && !opts.moveOnly)
            moves.push({ from: idx, to: ti, isCapture: true,
              isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
          return true;
        }
        if (!opts.captureOnly)
          moves.push({ from: idx, to: ti, isCapture: false,
            isPromotion: type === 'pawn' && (tr === 0 || tr === 7), ...opts });
        return false;
      };

      if (type === 'pawn') {
        const d = color === 'white' ? -1 : 1;
        const start = color === 'white' ? 6 : 1;
        if (!forAttack) {
          if (r+d>=0 && r+d<=7 && !state[(r+d)*8+c]) {
            add(r+d, c, { moveOnly: true });
            if (r === start && !state[(r+2*d)*8+c])
              moves.push({ from: idx, to: (r+2*d)*8+c, isDoublePush: true, isCapture: false, isPromotion: false });
          }
        }
        [-1,1].forEach(dc => {
          const tr = r+d, tc = c+dc;
          if (tr<0||tr>7||tc<0||tc>7) return;
          if (forAttack) {
            moves.push({ from: idx, to: tr*8+tc, isCapture: true, isPromotion: type==='pawn'&&(tr===0||tr===7) });
          } else {
            add(tr, tc, { captureOnly: true });
            if (lastDpIdx === r*8+tc)
              moves.push({ from: idx, to: tr*8+tc, isCapture: true, isEnPassant: true, isPromotion: false });
          }
        });
      } else if (type === 'knight') {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => add(r+dr,c+dc));
      } else if (type === 'king') {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => add(r+dr,c+dc));
        if (!forAttack && !piece.hasMoved) {
          const ksR = state[r*8+7];
          if (ksR?.type==='rook'&&!ksR.hasMoved&&!state[r*8+5]&&!state[r*8+6]&&
              !isAttackedW(r*8+5,enemy,state,lastDpIdx)&&!isAttackedW(r*8+6,enemy,state,lastDpIdx))
            moves.push({ from: idx, to: r*8+6, isCastling: true, isCapture: false, isPromotion: false });
          const qsR = state[r*8];
          if (qsR?.type==='rook'&&!qsR.hasMoved&&!state[r*8+1]&&!state[r*8+2]&&!state[r*8+3]&&
              !isAttackedW(r*8+3,enemy,state,lastDpIdx)&&!isAttackedW(r*8+2,enemy,state,lastDpIdx))
            moves.push({ from: idx, to: r*8+2, isCastling: true, isCapture: false, isPromotion: false });
        }
      } else {
        const dirs = [];
        if (type !== 'bishop') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
        if (type !== 'rook')   dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
        dirs.forEach(([dr,dc]) => {
          let tr = r+dr, tc = c+dc;
          while (tr>=0&&tr<=7&&tc>=0&&tc<=7) { if (add(tr,tc)) break; tr+=dr; tc+=dc; }
        });
      }
      return moves;
    }

    function isAttackedW(idx, atkColor, state, dpIdx) {
      return state.some((p, i) => p && p.color === atkColor &&
        rawMovesW(i, p, state, dpIdx, true).some(m => m.to === idx));
    }

    function isInCheckW(color, state, dpIdx) {
      const ki = state.findIndex(p => p?.type==='king'&&p.color===color);
      return ki >= 0 && isAttackedW(ki, opp(color), state, dpIdx);
    }

    function cloneW(state) { return state.map(p => p ? {...p} : null); }

    function applyW(mv, state, dpIdx) {
      const { from, to, isCastling, isEnPassant, isDoublePush } = mv;
      const piece = state[from];
      if (!piece) return dpIdx;
      state[to] = { ...piece, hasMoved: true };
      state[from] = null;
      if (isCastling) {
        const row = from>>3, ks = to>from;
        const rF = ks?row*8+7:row*8, rT = ks?row*8+5:row*8+3;
        if (state[rF]) { state[rT]={...state[rF],hasMoved:true}; state[rF]=null; }
      }
      if (isEnPassant) {
        const ci = to + (state[to].color==='white'?8:-8);
        state[ci] = null;
      }
      if (mv.isPromotion) state[to].type = 'queen';
      return isDoublePush ? to : -1;
    }

    function legalW(idx, state, dpIdx) {
      const p = state[idx]; if (!p) return [];
      return rawMovesW(idx, p, state, dpIdx, false).filter(mv => {
        const sim = cloneW(state);
        applyW(mv, sim, dpIdx);
        return !isInCheckW(p.color, sim, mv.isDoublePush ? mv.to : -1);
      });
    }

    function allLegalW(color, state, dpIdx) {
      const res = [];
      state.forEach((p,i) => { if (p&&p.color===color) res.push(...legalW(i, state, dpIdx)); });
      return res;
    }

    function orderW(moves, state) {
      return [...moves].sort((a, b) => {
        const sc = mv => {
          let s = 0;
          if (mv.isCapture) { const cp = state[mv.to]; if (cp) s += VAL[cp.type]; }
          if (mv.isPromotion) s += VAL.queen;
          return s;
        };
        return sc(b) - sc(a);
      });
    }

    function countPieces(state) { return state.filter(Boolean).length; }

    function evalW(state, color) {
      let score = 0;
      const pieceCount = countPieces(state);
      const endgame = pieceCount <= 12;
      state.forEach((p, i) => {
        if (!p) return;
        const pstIdx = p.color === 'white' ? i : 63 - i;
        const pst = (p.type === 'king' && endgame && PST.kingEnd)
          ? PST.kingEnd[pstIdx]
          : (PST[p.type] ? PST[p.type][pstIdx] : 0);
        const v = VAL[p.type] + pst;
        score += p.color === color ? v : -v;
      });
      return score;
    }

    function negamax(state, depth, alpha, beta, color, dpIdx) {
      if (depth === 0) return evalW(state, color);
      const moves = orderW(allLegalW(color, state, dpIdx), state);
      if (!moves.length) return isInCheckW(color, state, dpIdx) ? -50000 - depth : 0;
      let best = -Infinity;
      for (const mv of moves) {
        const sim = cloneW(state);
        const ndp = applyW(mv, sim, dpIdx);
        const s = -negamax(sim, depth-1, -beta, -alpha, opp(color), ndp);
        if (s > best) best = s;
        if (s > alpha) alpha = s;
        if (alpha >= beta) break;
      }
      return best;
    }

    self.onmessage = function(e) {
      const { state, color, depth, dpIdx } = e.data;
      const moves = orderW(allLegalW(color, state, dpIdx), state);
      if (!moves.length) { self.postMessage(null); return; }
      let best = null, bestScore = -Infinity;
      for (const mv of moves) {
        const sim = cloneW(state);
        const ndp = applyW(mv, sim, dpIdx);
        const score = -negamax(sim, depth-1, -Infinity, Infinity, opp(color), ndp);
        if (score > bestScore) { bestScore = score; best = mv; }
      }
      self.postMessage(best);
    };
  `;

  function startAI() {
    if (!gameActive) return;
    aiThinking = true;
    thinkingEl.classList.remove('hidden');
    stopTimer();

    // Terminate previous worker if any
    if (aiWorker) aiWorker.terminate();

    const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
    aiWorker = new Worker(URL.createObjectURL(blob));

    aiWorker.onmessage = e => {
      aiWorker = null;
      thinkingEl.classList.add('hidden');
      aiThinking = false;
      startTimer();

      const mv = e.data;
      if (mv && gameActive) {
        history.push(takeSnapshot());
        execMove(mv, boardState, true);
      }
    };

    aiWorker.postMessage({
      state:  cloneState(boardState),
      color:  aiColor,
      depth:  aiDepth,
      dpIdx:  lastMove.dpIdx,
    });
  }

  /* ═══════════════════════════════════════════════
     UNDO
  ═══════════════════════════════════════════════ */
  function undo() {
    if (aiThinking) return;
    const steps = (vsComputer && history.length >= 2) ? 2 : 1;
    for (let i = 0; i < steps && history.length; i++) {
      restoreSnapshot(history.pop());
      // Remove last move row if black's move, or whole row if white's
      if (moveRows.length) {
        const row = moveRows[moveRows.length - 1];
        if (row.black !== null && i === 0 && steps === 1) {
          row.black = null;
          row.el.querySelector('.move-black').textContent = '';
        } else {
          row.el.remove();
          moveRows.pop();
        }
      }
    }
    selected = null;
    setMsg('');
    clearHighlights();
    buildBoard();
    renderCaptured();
    updateTimerActive();
  }

  /* ═══════════════════════════════════════════════
     SNAPSHOT
  ═══════════════════════════════════════════════ */
  function takeSnapshot() {
    return {
      boardState:     cloneState(boardState),
      currentPlayer,
      kingPos:        { ...kingPos },
      lastMove:       { ...lastMove },
      moveCount,
      halfMoves,
      gameActive,
      capturedByWhite: [...capturedByWhite],
      capturedByBlack: [...capturedByBlack],
      timers:         { ...timers },
      positionHashes: [...positionHashes],
    };
  }

  function restoreSnapshot(snap) {
    boardState      = snap.boardState;
    currentPlayer   = snap.currentPlayer;
    kingPos         = snap.kingPos;
    lastMove        = snap.lastMove;
    moveCount       = snap.moveCount;
    halfMoves       = snap.halfMoves;
    gameActive      = snap.gameActive;
    capturedByWhite = snap.capturedByWhite;
    capturedByBlack = snap.capturedByBlack;
    timers          = snap.timers;
    positionHashes  = snap.positionHashes;
  }

  /* ═══════════════════════════════════════════════
     MOVE HISTORY (paired rows)
  ═══════════════════════════════════════════════ */
  function addMoveHistoryRow(mv, inCheck, isMate) {
    const san = buildSAN(mv, inCheck, isMate);
    const isWhiteTurn = opp(currentPlayer) === 'white'; // white just moved

    if (isWhiteTurn) {
      const num = Math.ceil(moveCount / 2);
      const li  = document.createElement('li');
      li.innerHTML =
        `<span class="move-num">${num}.</span>` +
        `<span class="move-white">${san}</span>` +
        `<span class="move-black"></span>`;
      moveHistEl.appendChild(li);
      moveRows.push({ num, white: san, black: null, el: li });
    } else {
      if (moveRows.length) {
        const row = moveRows[moveRows.length - 1];
        row.black = san;
        row.el.querySelector('.move-black').textContent = san;
      }
    }
    moveHistEl.scrollTop = moveHistEl.scrollHeight;
  }

  function buildSAN(mv, inCheck, isMate) {
    if (mv.isCastling) {
      let s = mv.to > mv.from ? 'O-O' : 'O-O-O';
      if (isMate)    s += '#';
      else if (inCheck) s += '+';
      return s;
    }

    const piece = boardState[mv.to];
    const ptype = piece ? piece.type : (mv.promotedTo ?? 'pawn');
    const pLetter = ptype === 'pawn' ? '' : pieceNotationChar(ptype);

    // Disambiguation (if needed)
    let disambig = '';
    if (ptype !== 'pawn') {
      const ambiguous = boardState.filter((p, i) =>
        p && p.color === opp(currentPlayer) &&
        p.type === ptype && i !== mv.to
      );
      if (ambiguous.length > 0) {
        const fromFile = String.fromCharCode(97 + (mv.from & 7));
        disambig = fromFile;
      }
    }

    const capture  = mv.isCapture || mv.isEnPassant;
    const fileFrom = ptype === 'pawn' && capture
      ? String.fromCharCode(97 + (mv.from & 7))
      : '';
    const dest     = algebraic(mv.to);
    const promo    = mv.promotedTo ? `=${pieceNotationChar(mv.promotedTo)}` : '';

    let s = pLetter + disambig + fileFrom + (capture ? 'x' : '') + dest + promo;
    if (isMate)    s += '#';
    else if (inCheck) s += '+';
    return s;
  }

  /* ═══════════════════════════════════════════════
     TIMERS
  ═══════════════════════════════════════════════ */
  function startTimer() {
    stopTimer();
    timerTick = setInterval(() => {
      if (!gameActive || aiThinking) return;
      timers[currentPlayer] -= 1;
      if (timers[currentPlayer] <= 0) {
        timers[currentPlayer] = 0;
        updateTimerDisplay();
        gameActive = false;
        stopTimer();
        play(SND.over);
        const winner = opp(currentPlayer);
        showGameOver('⏰', `${winner === 'white' ? 'Brancas' : 'Pretas'} vencem!`, 'Tempo esgotado!');
        setMsg('TEMPO ESGOTADO!', 'mate');
        return;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerTick);
    timerTick = null;
  }

  function updateTimerActive() {
    timerWhiteBlk.classList.toggle('active', currentPlayer === 'white');
    timerBlackBlk.classList.toggle('active', currentPlayer === 'black');
    timerWhiteBlk.classList.remove('low');
    timerBlackBlk.classList.remove('low');
    if (timers.white <= 30) timerWhiteBlk.classList.add('low');
    if (timers.black <= 30) timerBlackBlk.classList.add('low');
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    timerWhiteEl.textContent = formatTime(timers.white);
    timerBlackEl.textContent = formatTime(timers.black);
    if (timers.white <= 30) timerWhiteBlk.classList.add('low');
    if (timers.black <= 30) timerBlackBlk.classList.add('low');
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ═══════════════════════════════════════════════
     UI HELPERS
  ═══════════════════════════════════════════════ */
  function setMsg(text, cls = '') {
    msgEl.textContent = text;
    msgEl.className   = 'game-message' + (cls ? ' ' + cls : '');
  }

  function showGameOver(icon, title, msg) {
    gameoverIcon.textContent  = icon;
    gameoverTitle.textContent = title;
    gameoverMsg.textContent   = msg;
    gameoverModal.style.display = 'flex';
  }

  function opp(c) { return c === 'white' ? 'black' : 'white'; }

  function algebraic(i) {
    return String.fromCharCode(97 + (i & 7)) + (8 - (i >> 3));
  }

  function pieceNotationChar(t) {
    return { pawn:'', knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K' }[t] ?? '';
  }

  function pieceNamePT(t) {
    return { pawn:'peão', knight:'cavalo', bishop:'bispo', rook:'torre', queen:'rainha', king:'rei' }[t] ?? t;
  }

  /* ═══════════════════════════════════════════════
     INIT / RESTART
  ═══════════════════════════════════════════════ */
  function initGame() {
    if (aiWorker) { aiWorker.terminate(); aiWorker = null; }
    stopTimer();

    boardState      = Array.from({ length: 64 }, (_, i) => getInitialPiece(i));
    currentPlayer   = 'white';
    selected        = null;
    gameActive      = true;
    aiThinking      = false;
    moveCount       = 0;
    halfMoves       = 0;
    history         = [];
    moveRows        = [];
    capturedByWhite = [];
    capturedByBlack = [];
    positionHashes  = [];
    lastMove        = { from: -1, to: -1, dpIdx: -1 };
    kingPos         = { white: 60, black: 4 };
    timers          = { white: TIMER_START, black: TIMER_START };

    setMsg('');
    moveHistEl.innerHTML = '';
    gameoverModal.style.display = 'none';
    promoModal.style.display    = 'none';
    thinkingEl.classList.add('hidden');

    buildBoard();
    updateTimerActive();
    startTimer();

    if (vsComputer && aiColor === 'white') startAI();
  }

  /* ═══════════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════════ */
  // Mode
  btnPvP.addEventListener('click', () => {
    vsComputer = false;
    btnPvP.setAttribute('aria-pressed', 'true');
    btnPvC.setAttribute('aria-pressed', 'false');
    btnPvP.classList.add('active'); btnPvC.classList.remove('active');
    aiOptionsEl.classList.add('hidden');
    initGame();
  });

  btnPvC.addEventListener('click', () => {
    vsComputer = true;
    btnPvC.setAttribute('aria-pressed', 'true');
    btnPvP.setAttribute('aria-pressed', 'false');
    btnPvC.classList.add('active'); btnPvP.classList.remove('active');
    aiOptionsEl.classList.remove('hidden');
    initGame();
  });

  // Difficulty
  diffBtns.forEach(b => b.addEventListener('click', () => {
    diffBtns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
    b.classList.add('active');
    b.setAttribute('aria-pressed', 'true');
    aiDepth = parseInt(b.dataset.depth, 10);
    initGame();
  }));

  // Color
  colorBtns.forEach(b => b.addEventListener('click', () => {
    colorBtns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
    b.classList.add('active');
    b.setAttribute('aria-pressed', 'true');
    aiColor     = opp(b.dataset.color);
    orientation = b.dataset.color;
    initGame();
  }));

  undoBtn.addEventListener('click', undo);

  flipBtn.addEventListener('click', () => {
    orientation = opp(orientation);
    buildBoard();
    renderCaptured();
  });

  restartBtn.addEventListener('click', initGame);
  gameoverRestart.addEventListener('click', () => {
    gameoverModal.style.display = 'none';
    initGame();
  });

  notationBtn.addEventListener('click', () => {
    showNotation = !showNotation;
    notationBtn.classList.toggle('active', showNotation);
    buildBoard(); // rebuild with notation data-attrs
  });

  saveHistBtn.addEventListener('click', saveGameAsTxt);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'BUTTON') return;
    if (e.key === 'n' || e.key === 'N') { if (!e.ctrlKey && !e.metaKey) initGame(); }
    if (e.key === 'f' || e.key === 'F') { orientation = opp(orientation); buildBoard(); renderCaptured(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  });

  /* ═══════════════════════════════════════════════
     SAVE GAME AS .TXT
  ═══════════════════════════════════════════════ */
  function saveGameAsTxt() {
    if (!moveRows.length) return;

    const mode       = vsComputer ? `vs IA (Profundidade ${aiDepth})` : '2 Jogadores';
    const dateStr    = new Date().toLocaleString('pt-BR');
    const wTime      = formatTime(timers.white);
    const bTime      = formatTime(timers.black);
    const resultLine = msgEl.textContent.trim() || '(partida em andamento)';

    const lines = [
      '╔══════════════════════════════════════════╗',
      '║         CHESS XI · IBM Bob               ║',
      '║         Registro de Partida              ║',
      '╚══════════════════════════════════════════╝',
      '',
      `Data/Hora : ${dateStr}`,
      `Modo      : ${mode}`,
      `Resultado : ${resultLine}`,
      `Tempo restante — Brancas: ${wTime}  |  Pretas: ${bTime}`,
      '',
      '──────────────────────────────────────────',
      '  #    Brancas       Pretas',
      '──────────────────────────────────────────',
    ];

    moveRows.forEach(row => {
      const num   = String(row.num).padStart(3, ' ');
      const white = (row.white  ?? '').padEnd(12, ' ');
      const black = (row.black  ?? '').padEnd(12, ' ');
      lines.push(`  ${num}.  ${white}  ${black}`);
    });

    lines.push('──────────────────────────────────────────');
    lines.push(`Total de lances: ${moveCount}`);
    lines.push('');

    const blob     = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    const filename = `chess_xi_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.txt`;
    a.href         = url;
    a.download     = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Brief visual feedback on the button
    saveHistBtn.textContent = '✓ Salvo!';
    saveHistBtn.disabled    = true;
    setTimeout(() => {
      saveHistBtn.textContent = '⬇ Salvar .txt';
      saveHistBtn.disabled    = false;
    }, 1800);
  }

  /* ═══════════════════════════════════════════════
     DATETIME CLOCK
  ═══════════════════════════════════════════════ */
  function updateClock() {
    datetimeEl.textContent = new Date().toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ═══════════════════════════════════════════════
     START
  ═══════════════════════════════════════════════ */
  initGame();
});
