ogo da Velha (Tic-Tac-Toe) em HTML

Vou criar um jogo da velha completo em um único arquivo HTML que você pode executar diretamente no navegador. O jogo terá interface visual, controle de turnos, detecção de vitória/empate e opção de reiniciar.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jogo da Velha - Tic-Tac-Toe</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            width: 100%;
            text-align: center;
        }
        
        h1 {
            margin-bottom: 10px;
            color: #4cc9f0;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            font-size: 2.8rem;
        }
        
        .subtitle {
            margin-bottom: 30px;
            color: #a9a9a9;
            font-size: 1.1rem;
        }
        
        .game-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        
        .game-info {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 400px;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        
        .player-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .current-player {
            color: #4cc9f0;
            transition: all 0.3s ease;
        }
        
        .player-x {
            color: #f72585;
        }
        
        .player-o {
            color: #4361ee;
        }
        
        .score-board {
            display: flex;
            gap: 20px;
            font-size: 1.1rem;
        }
        
        .score {
            padding: 5px 15px;
            border-radius: 5px;
            background-color: rgba(0, 0, 0, 0.2);
        }
        
        .board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-gap: 10px;
            margin: 20px auto;
            max-width: 400px;
            width: 100%;
        }
        
        .cell {
            aspect-ratio: 1/1;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .cell:hover {
            background-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .cell.x {
            color: #f72585;
        }
        
        .cell.o {
            color: #4361ee;
        }
        
        .cell.winning {
            background-color: rgba(76, 201, 240, 0.3);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(76, 201, 240, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0); }
        }
        
        .controls {
            margin-top: 20px;
            display: flex;
            gap: 15px;
        }
        
        button {
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: bold;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        #reset-btn {
            background-color: #4cc9f0;
            color: #1a1a2e;
        }
        
        #reset-btn:hover {
            background-color: #3aa8cc;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        #new-game-btn {
            background-color: transparent;
            color: #fff;
            border: 2px solid #4cc9f0;
        }
        
        #new-game-btn:hover {
            background-color: rgba(76, 201, 240, 0.1);
            transform: translateY(-2px);
        }
        
        .message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: bold;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .win-message {
            background-color: rgba(67, 97, 238, 0.2);
            color: #4361ee;
        }
        
        .draw-message {
            background-color: rgba(255, 255, 255, 0.1);
            color: #a9a9a9;
        }
        
        .instructions {
            margin-top: 30px;
            max-width: 600px;
            background-color: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: left;
        }
        
        .instructions h3 {
            color: #4cc9f0;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .instructions ul {
            padding-left: 20px;
            margin-bottom: 15px;
        }
        
        .instructions li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        footer {
            margin-top: 30px;
            color: #a9a9a9;
            font-size: 0.9rem;
            text-align: center;
        }
        
        @media (max-width: 500px) {
            h1 {
                font-size: 2.2rem;
            }
            
            .cell {
                font-size: 2.8rem;
            }
            
            .game-info {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Jogo da Velha</h1>
        <p class="subtitle">Tic-Tac-Toe • Dois jogadores • X e O</p>
        
        <div class="game-area">
            <div class="game-info">
                <div class="player-indicator">
                    Vez de: <span id="current-player" class="current-player player-x">X</span>
                </div>
                <div class="score-board">
                    <div class="score player-x">X: <span id="score-x">0</span></div>
                    <div class="score player-o">O: <span id="score-o">0</span></div>
                    <div class="score">Empates: <span id="score-draw">0</span></div>
                </div>
            </div>
            
            <div class="board" id="board">
                <!-- As células do tabuleiro serão geradas via JavaScript -->
            </div>
            
            <div class="message" id="message">
                O jogo começou! Vez do jogador X.
            </div>
            
            <div class="controls">
                <button id="reset-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    Reiniciar Jogo
                </button>
                <button id="new-game-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Novo Jogo (zerar placar)
                </button>
            </div>
        </div>
        
        <div class="instructions">
            <h3>Como Jogar</h3>
            <ul>
                <li>Os jogadores alternam entre X e O</li>
                <li>Clique em qualquer célula vazia para fazer sua jogada</li>
                <li>O primeiro jogador a formar uma linha horizontal, vertical ou diagonal com 3 símbolos iguais vence</li>
                <li>Se todas as células forem preenchidas sem vencedor, o jogo termina em empate</li>
                <li>Use "Reiniciar Jogo" para começar uma nova partida com o mesmo placar</li>
                <li>Use "Novo Jogo" para zerar o placar e começar do zero</li>
            </ul>
        </div>
        
        <footer>
            <p>Jogo da Velha • Desenvolvido com HTML, CSS e JavaScript</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Elementos do DOM
            const boardElement = document.getElementById('board');
            const currentPlayerElement = document.getElementById('current-player');
            const messageElement = document.getElementById('message');
            const resetButton = document.getElementById('reset-btn');
            const newGameButton = document.getElementById('new-game-btn');
            const scoreXElement = document.getElementById('score-x');
            const scoreOElement = document.getElementById('score-o');
            const scoreDrawElement = document.getElementById('score-draw');
            
            // Estado do jogo
            let currentPlayer = 'X';
            let gameBoard = ['', '', '', '', '', '', '', '', ''];
            let gameActive = true;
            let scores = {
                X: 0,
                O: 0,
                draw: 0
            };
            
            // Padrões de vitória (índices das células)
            const winPatterns = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas horizontais
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // linhas verticais
                [0, 4, 8], [2, 4, 6]             // diagonais
            ];
            
            // Inicializar o tabuleiro
            function initializeBoard() {
                boardElement.innerHTML = '';
                gameBoard = ['', '', '', '', '', '', '', '', ''];
                
                for (let i = 0; i < 9; i++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.index = i;
                    cell.addEventListener('click', () => handleCellClick(i));
                    boardElement.appendChild(cell);
                }
            }
            
            // Manipular clique em uma célula
            function handleCellClick(index) {
                if (!gameActive || gameBoard[index] !== '') return;
                
                // Atualizar estado do jogo
                gameBoard[index] = currentPlayer;
                
                // Atualizar interface
                const cellElement = document.querySelector(`.cell[data-index="${index}"]`);
                cellElement.textContent = currentPlayer;
                cellElement.classList.add(currentPlayer.toLowerCase());
                
                // Verificar vitória
                const winResult = checkWin();
                if (winResult) {
                    handleWin(winResult);
                    return;
                }
                
                // Verificar empate
                if (!gameBoard.includes('')) {
                    handleDraw();
                    return;
                }
                
                // Alternar jogador
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                updatePlayerIndicator();
                updateMessage(`Vez do jogador ${currentPlayer}`);
            }
            
            // Verificar se há um vencedor
            function checkWin() {
                for (const pattern of winPatterns) {
                    const [a, b, c] = pattern;
                    if (
                        gameBoard[a] && 
                        gameBoard[a] === gameBoard[b] && 
                        gameBoard[a] === gameBoard[c]
                    ) {
                        return { winner: gameBoard[a], pattern };
                    }
                }
                return null;
            }
            
            // Processar vitória
            function handleWin(result) {
                gameActive = false;
                const { winner, pattern } = result;
                
                // Atualizar placar
                scores[winner]++;
                updateScores();
                
                // Destacar células vencedoras
                pattern.forEach(index => {
                    const cell = document.querySelector(`.cell[data-index="${index}"]`);
                    cell.classList.add('winning');
                });
                
                // Atualizar mensagem
                const playerClass = winner === 'X' ? 'player-x' : 'player-o';
                updateMessage(`Jogador ${winner} venceu!`, `win-message ${playerClass}`);
            }
            
            // Processar empate
            function handleDraw() {
                gameActive = false;
                scores.draw++;
                updateScores();
                updateMessage('Empate! Todas as células foram preenchidas.', 'draw-message');
            }
            
            // Atualizar indicador do jogador atual
            function updatePlayerIndicator() {
                currentPlayerElement.textContent = currentPlayer;
                currentPlayerElement.className = `current-player player-${currentPlayer.toLowerCase()}`;
            }
            
            // Atualizar mensagem
            function updateMessage(text, className = '') {
                messageElement.textContent = text;
                messageElement.className = 'message';
                if (className) {
                    messageElement.classList.add(...className.split(' '));
                }
            }
            
            // Atualizar placar
            function updateScores() {
                scoreXElement.textContent = scores.X;
                scoreOElement.textContent = scores.O;
                scoreDrawElement.textContent = scores.draw;
            }
            
            // Reiniciar o jogo (mesmo placar)
            function resetGame() {
                gameActive = true;
                currentPlayer = 'X';
                initializeBoard();
                updatePlayerIndicator();
                updateMessage('O jogo começou! Vez do jogador X.');
            }
            
            // Novo jogo (zerar placar)
            function newGame() {
                scores = { X: 0, O: 0, draw: 0 };
                updateScores();
                resetGame();
            }
            
            // Carregar placar do localStorage (se existir)
            function loadScores() {
                const savedScores = localStorage.getItem('ticTacToeScores');
                if (savedScores) {
                    scores = JSON.parse(savedScores);
                    updateScores();
                }
            }
            
            // Salvar placar no localStorage
            function saveScores() {
                localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
            }
            
            // Event listeners
            resetButton.addEventListener('click', resetGame);
            newGameButton.addEventListener('click', newGame);
            
            // Salvar placar quando a página for fechada
            window.addEventListener('beforeunload', saveScores);
            
            // Inicializar jogo
            loadScores();
            initializeBoard();
            updatePlayerIndicator();
        });
    </script>
</body>
</html>
```

## Como usar:

1. **Copie todo o código acima** (desde `<!DOCTYPE html>` até `</html>`)
2. **Crie um novo arquivo** no seu computador chamado `jogo-da-velha.html`
3. **Cole o código** no arquivo e sal
---
API: OpenRouter | LLM: stepfun/step-3.5-flash:free
TOKENS: {'prompt_tokens': 32, 'completion_tokens': 4096, 'total_tokens': 4128, 'cost': 0, 'is_byok': False, 'prompt_tokens_details': {'cached_tokens': 0, 'audio_tokens': 0}, 'cost_details': {'upstream_inference_cost': 0, 'upstream_inference_prompt_cost': 0, 'upstream_inference_completions_cost': 0}, 'completion_tokens_details': {'reasoning_tokens': 165, 'audio_tokens': 0}}
2026-02-03 14:34:07.95
