export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Matrix = number[][];

export interface Tetromino {
  type: TetrominoType;
  matrix: Matrix;
  x: number;
  y: number;
}

export const COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

const SHAPES: Record<TetrominoType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function createTetromino(type: TetrominoType): Tetromino {
  const matrix = SHAPES[type].map((row) => [...row]);
  const x = Math.floor((10 - matrix[0].length) / 2);
  return { type, matrix, x, y: 0 };
}

export function randomType(): TetrominoType {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

export function rotate(matrix: Matrix, clockwise = true): Matrix {
  const n = matrix.length;
  const result: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (clockwise) {
        result[c][n - 1 - r] = matrix[r][c];
      } else {
        result[n - 1 - c][r] = matrix[r][c];
      }
    }
  }
  return result;
}
