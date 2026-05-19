import {
  Board,
  createBoard,
  isValidPosition,
  lockTetromino,
  clearLines,
  getCompleteRows,
} from './board';
import {
  Tetromino,
  createTetromino,
  randomType,
  rotate,
} from './tetromino';
import {
  renderBoard,
  renderPiece,
  renderNext,
  renderFlash,
  renderParticles,
  generateParticles,
  updateParticles,
  Particle,
} from './renderer';

const LINES_PER_LEVEL = 10;
const SCORE_TABLE = [0, 100, 300, 500, 800];
const FLASH_DURATION = 400;
const SHATTER_DURATION = 500;
const TOTAL_CLEAR_ANIM = FLASH_DURATION + SHATTER_DURATION;

function dropInterval(level: number): number {
  return Math.max(50, 800 - (level - 1) * 70);
}

export type GameState = 'idle' | 'playing' | 'paused' | 'clearing' | 'gameover';

export class TetrisGame {
  private board: Board = createBoard();
  private current: Tetromino;
  private next: Tetromino;
  private state: GameState = 'idle';

  private score = 0;
  private level = 1;
  private lines = 0;

  private lastDrop = 0;
  private animFrame = 0;

  private clearingRows: number[] = [];
  private clearingStart = 0;
  private pendingLines = 0;
  private particles: Particle[] = [];

  private stateBeforePause: 'playing' | 'clearing' = 'playing';
  private pausedAt = 0;

  private ctx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;

  private onScoreChange: (score: number, level: number, lines: number) => void;
  private onGameOver: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    onScoreChange: (score: number, level: number, lines: number) => void,
    onGameOver: () => void
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.nextCtx = nextCanvas.getContext('2d')!;
    this.onScoreChange = onScoreChange;
    this.onGameOver = onGameOver;
    this.current = createTetromino(randomType());
    this.next = createTetromino(randomType());
  }

  start(): void {
    this.board = createBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.clearingRows = [];
    this.particles = [];
    this.current = createTetromino(randomType());
    this.next = createTetromino(randomType());
    this.state = 'playing';
    this.lastDrop = performance.now();
    this.onScoreChange(0, 1, 0);
    cancelAnimationFrame(this.animFrame);
    this.loop(performance.now());
  }

  togglePause(): void {
    if (this.state === 'playing' || this.state === 'clearing') {
      this.stateBeforePause = this.state;
      this.pausedAt = performance.now();
      this.state = 'paused';
      cancelAnimationFrame(this.animFrame);
      this.render(this.pausedAt);
    } else if (this.state === 'paused') {
      const pauseDuration = performance.now() - this.pausedAt;
      this.lastDrop += pauseDuration;
      this.clearingStart += pauseDuration;
      this.state = this.stateBeforePause;
      this.loop(performance.now());
    }
  }

  moveLeft(): void {
    if (this.state !== 'playing') return;
    this.tryMove(-1, 0);
  }

  moveRight(): void {
    if (this.state !== 'playing') return;
    this.tryMove(1, 0);
  }

  softDrop(): void {
    if (this.state !== 'playing') return;
    if (!this.tryMove(0, 1)) {
      this.lock();
    } else {
      this.score += 1;
      this.onScoreChange(this.score, this.level, this.lines);
    }
  }

  hardDrop(): void {
    if (this.state !== 'playing') return;
    let dropped = 0;
    while (isValidPosition(this.board, this.current.matrix, this.current.x, this.current.y + 1)) {
      this.current.y++;
      dropped++;
    }
    this.score += dropped * 2;
    this.lock();
  }

  rotatePiece(): void {
    if (this.state !== 'playing') return;
    const rotated = rotate(this.current.matrix);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (isValidPosition(this.board, rotated, this.current.x + kick, this.current.y)) {
        this.current.matrix = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private tryMove(dx: number, dy: number): boolean {
    if (isValidPosition(this.board, this.current.matrix, this.current.x + dx, this.current.y + dy)) {
      this.current.x += dx;
      this.current.y += dy;
      return true;
    }
    return false;
  }

  private lock(): void {
    this.board = lockTetromino(this.board, this.current);
    const completeRows = getCompleteRows(this.board);

    if (completeRows.length > 0) {
      this.clearingRows = completeRows;
      this.pendingLines = completeRows.length;
      this.clearingStart = performance.now();
      this.particles = generateParticles(this.board, completeRows);
      this.state = 'clearing';
    } else {
      this.spawnNext();
    }
  }

  private spawnNext(): void {
    this.current = this.next;
    this.next = createTetromino(randomType());
    this.lastDrop = performance.now();

    if (!isValidPosition(this.board, this.current.matrix, this.current.x, this.current.y)) {
      this.state = 'gameover';
      this.onGameOver();
    }
  }

  private finishClearing(): void {
    const { board } = clearLines(this.board);
    this.board = board;
    this.lines += this.pendingLines;
    this.score += SCORE_TABLE[this.pendingLines] * this.level;
    this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    this.onScoreChange(this.score, this.level, this.lines);
    this.clearingRows = [];
    this.particles = [];
    this.pendingLines = 0;
    this.state = 'playing';
    this.spawnNext();
  }

  private render(now: number): void {
    if (this.state === 'clearing') {
      const elapsed = now - this.clearingStart;
      const inFlash = elapsed < FLASH_DURATION;
      const skipRows = inFlash ? undefined : new Set(this.clearingRows);

      renderBoard(this.ctx, this.board, skipRows);

      if (inFlash) {
        renderFlash(this.ctx, this.board, this.clearingRows, elapsed / FLASH_DURATION);
      }

      renderParticles(this.ctx, this.particles);
    } else {
      renderBoard(this.ctx, this.board);

      if (this.state === 'playing' || this.state === 'gameover') {
        renderPiece(this.ctx, this.current, this.board);
      }

      if (this.state === 'paused') {
        this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSE', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
      }
    }

    renderNext(this.nextCtx, this.next);
  }

  private loop(now: number): void {
    if (this.state === 'playing') {
      const elapsed = now - this.lastDrop;
      if (elapsed >= dropInterval(this.level)) {
        if (!this.tryMove(0, 1)) {
          this.lock();
        }
        if (this.state === 'playing') this.lastDrop = now;
      }
    } else if (this.state === 'clearing') {
      const elapsed = now - this.clearingStart;
      if (elapsed >= TOTAL_CLEAR_ANIM) {
        this.finishClearing();
      } else {
        updateParticles(this.particles);
      }
    }

    this.render(now);

    if (this.state === 'playing' || this.state === 'clearing') {
      this.animFrame = requestAnimationFrame((t) => this.loop(t));
    }
  }
}
