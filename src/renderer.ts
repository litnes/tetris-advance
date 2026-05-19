import { Board, CELL_SIZE, BOARD_COLS, BOARD_ROWS, getGhostY } from './board';
import { Tetromino, COLORS } from './tetromino';

const GRID_COLOR = '#1e1e3a';
const BG_COLOR = '#0d0d1a';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

export function generateParticles(board: Board, rows: number[]): Particle[] {
  const ps: Particle[] = [];
  for (const row of rows) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const color = board[row][col];
      if (!color) continue;
      const cx = (col + 0.5) * CELL_SIZE;
      const cy = (row + 0.5) * CELL_SIZE;
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5) * 0.9;
        const speed = Math.random() * 5 + 2;
        ps.push({
          x: cx + (Math.random() - 0.5) * CELL_SIZE * 0.4,
          y: cy + (Math.random() - 0.5) * CELL_SIZE * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          color,
          alpha: 1,
          size: Math.random() * 6 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.35,
        });
      }
    }
  }
  return ps;
}

export function updateParticles(particles: Particle[]): void {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.vx *= 0.97;
    p.alpha -= 0.022;
    p.rotation += p.rotSpeed;
    p.size *= 0.965;
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha = 1
): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, 3);
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, 3, CELL_SIZE - 2);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + CELL_SIZE - 4, CELL_SIZE - 2, 3);
  ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 4, y * CELL_SIZE + 1, 3, CELL_SIZE - 2);

  ctx.globalAlpha = 1;
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  skipRows?: ReadonlySet<number>
): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE);

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  for (let r = 0; r <= BOARD_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_SIZE);
    ctx.lineTo(BOARD_COLS * CELL_SIZE, r * CELL_SIZE);
    ctx.stroke();
  }
  for (let c = 0; c <= BOARD_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_SIZE, 0);
    ctx.lineTo(c * CELL_SIZE, BOARD_ROWS * CELL_SIZE);
    ctx.stroke();
  }

  for (let r = 0; r < BOARD_ROWS; r++) {
    if (skipRows?.has(r)) continue;
    for (let c = 0; c < BOARD_COLS; c++) {
      const color = board[r][c];
      if (color) drawCell(ctx, c, r, color);
    }
  }
}

export function renderFlash(
  ctx: CanvasRenderingContext2D,
  board: Board,
  rows: number[],
  progress: number
): void {
  const pulse = Math.abs(Math.sin(progress * Math.PI * 6));

  ctx.save();
  for (const row of rows) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const color = board[row][col];
      if (!color) continue;
      const px = col * CELL_SIZE;
      const py = row * CELL_SIZE;

      // outer glow
      ctx.shadowBlur = 12 + pulse * 28;
      ctx.shadowColor = color;
      ctx.globalAlpha = 0.7 + pulse * 0.3;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      // white flash overlay on peaks
      if (pulse > 0.5) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = (pulse - 0.5) * 1.6;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();
  for (const p of particles) {
    if (p.alpha <= 0) continue;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function renderPiece(
  ctx: CanvasRenderingContext2D,
  piece: Tetromino,
  board: Board
): void {
  const color = COLORS[piece.type];
  const ghostY = getGhostY(board, piece);

  if (ghostY !== piece.y) {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;
        drawCell(ctx, piece.x + c, ghostY + r, color, 0.2);
      }
    }
  }

  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      drawCell(ctx, piece.x + c, piece.y + r, color);
    }
  }
}

export function renderNext(ctx: CanvasRenderingContext2D, piece: Tetromino): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const color = COLORS[piece.type];
  const m = piece.matrix;
  const offsetX = Math.floor((4 - m[0].length) / 2);
  const offsetY = Math.floor((3 - m.length) / 2);

  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const px = (offsetX + c) * (CELL_SIZE - 1);
      const py = (offsetY + r) * (CELL_SIZE - 1);
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 3, CELL_SIZE - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 3, 3);
    }
  }
}
