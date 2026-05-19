import { Tetromino, Matrix, COLORS } from './tetromino';

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const CELL_SIZE = 30;

// 0 = empty, non-zero = color index
export type Board = string[][];

export function createBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(''));
}

export function isValidPosition(board: Board, matrix: Matrix, x: number, y: number): boolean {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const newX = x + c;
      const newY = y + r;
      if (newX < 0 || newX >= BOARD_COLS || newY >= BOARD_ROWS) return false;
      if (newY >= 0 && board[newY][newX]) return false;
    }
  }
  return true;
}

export function lockTetromino(board: Board, piece: Tetromino): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const bx = piece.x + c;
      const by = piece.y + r;
      if (by >= 0) {
        newBoard[by][bx] = COLORS[piece.type];
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { board: Board; linesCleared: number } {
  const newBoard = board.filter((row) => row.some((cell) => !cell));
  const linesCleared = BOARD_ROWS - newBoard.length;
  const emptyRows: Board = Array.from({ length: linesCleared }, () =>
    Array(BOARD_COLS).fill('')
  );
  return { board: [...emptyRows, ...newBoard], linesCleared };
}

export function getCompleteRows(board: Board): number[] {
  const rows: number[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    if (board[r].every((cell) => cell !== '')) rows.push(r);
  }
  return rows;
}

export function getGhostY(board: Board, piece: Tetromino): number {
  let ghostY = piece.y;
  while (isValidPosition(board, piece.matrix, piece.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}
