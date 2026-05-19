import { TetrisGame } from './game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const scoreEl = document.getElementById('score-display')!;
const levelEl = document.getElementById('level-display')!;
const linesEl = document.getElementById('lines-display')!;
const overlay = document.getElementById('overlay')!;
const startBtn = document.getElementById('start-btn')!;
const overlayTitle = overlay.querySelector('h1')!;
const overlayMsg = overlay.querySelector('p')!;

const game = new TetrisGame(
  canvas,
  nextCanvas,
  (score, level, lines) => {
    scoreEl.textContent = score.toLocaleString();
    levelEl.textContent = String(level);
    linesEl.textContent = String(lines);
  },
  () => {
    overlayTitle.textContent = 'GAME OVER';
    overlayMsg.textContent = `スコア: ${scoreEl.textContent}`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
  }
);

function startGame(): void {
  overlay.style.display = 'none';
  overlayTitle.textContent = 'テトリス';
  overlayMsg.textContent = 'スペースキーまたはボタンでスタート';
  startBtn.textContent = 'START';
  game.start();
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (overlay.style.display !== 'none') {
    if (e.code === 'Space') {
      e.preventDefault();
      startGame();
    }
    return;
  }

  switch (e.code) {
    case 'ArrowLeft':
      e.preventDefault();
      game.moveLeft();
      break;
    case 'ArrowRight':
      e.preventDefault();
      game.moveRight();
      break;
    case 'ArrowDown':
      e.preventDefault();
      game.softDrop();
      break;
    case 'ArrowUp':
      e.preventDefault();
      game.rotatePiece();
      break;
    case 'Space':
      e.preventDefault();
      game.hardDrop();
      break;
    case 'KeyP':
    case 'Escape':
      game.togglePause();
      break;
  }
});
