/**
 * Lightweight, zero-dependency QR Code (Model 2, Byte Encoding) generator in pure TypeScript.
 * Supports arbitrary URLs and text up to Version 4 (approx 78 ASCII characters with Level M error correction).
 */

// GF(2^8) math for QR error correction
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = val;
    GF_EXP[i + 255] = val;
    GF_LOG[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(numEcBytes: number): number[] {
  let poly = [1];
  for (let i = 0; i < numEcBytes; i++) {
    poly = polyMul(poly, [1, GF_EXP[i]]);
  }
  return poly;
}

function calculateErrorCorrection(data: Uint8Array, numEcBytes: number): Uint8Array {
  const gen = getGeneratorPoly(numEcBytes);
  const remainder = new Uint8Array(numEcBytes);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < numEcBytes - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[numEcBytes - 1] = gfMul(gen[numEcBytes], factor);
  }
  return remainder;
}

// QR Code Versions configuration for Level L / M
interface QRVersionConfig {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  alignmentPatterns: number[];
}

const VERSIONS: QRVersionConfig[] = [
  { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7, alignmentPatterns: [] },
  { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, alignmentPatterns: [6, 18] },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, alignmentPatterns: [6, 22] },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, alignmentPatterns: [6, 26] },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 108, ecBytes: 26, alignmentPatterns: [6, 30] },
  { version: 6, size: 41, totalBytes: 172, dataBytes: 136, ecBytes: 36, alignmentPatterns: [6, 34] }
];

export function generateQrMatrix(text: string): boolean[][] {
  const textBytes = new TextEncoder().encode(text);
  const dataLen = textBytes.length;

  // Find smallest version that fits (Mode: Byte = 4 bits, Char count = 8 bits, plus data)
  const neededDataBytes = dataLen + 2; // Approximate byte overhead
  const ver = VERSIONS.find(v => v.dataBytes >= neededDataBytes);
  if (!ver) {
    throw new Error(`Text length (${dataLen} bytes) exceeds maximum supported QR capacity (${VERSIONS[VERSIONS.length - 1].dataBytes - 2} bytes)`);
  }

  // Bit buffer
  const bitBuffer: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >>> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for Version 1-9)
  pushBits(textBytes.length, 8);
  // Data bytes
  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }
  // Terminator
  const capBits = ver.dataBytes * 8;
  const termLen = Math.min(4, capBits - bitBuffer.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  // Convert to bytes and pad with 0xEC, 0x11
  const rawData = new Uint8Array(ver.dataBytes);
  for (let i = 0; i < bitBuffer.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitBuffer[i * 8 + b];
    }
    rawData[i] = byte;
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  for (let i = bitBuffer.length / 8; i < ver.dataBytes; i++) {
    rawData[i] = padBytes[padIdx % 2];
    padIdx++;
  }

  // Error correction
  const ec = calculateErrorCorrection(rawData, ver.ecBytes);
  const finalCodewords = new Uint8Array(ver.totalBytes);
  finalCodewords.set(rawData, 0);
  finalCodewords.set(ec, rawData.length);

  // Build matrix
  const size = ver.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Finder patterns (7x7) + separators
  function setFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[tr][tc] = isBorder || isCenter;
          } else {
            matrix[tr][tc] = false; // Separator
          }
        }
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // 2. Alignment patterns
  if (ver.alignmentPatterns.length > 0) {
    for (const r of ver.alignmentPatterns) {
      for (const c of ver.alignmentPatterns) {
        if (matrix[r][c] !== null) continue; // Skip finders
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isDot = dr === 0 && dc === 0;
            matrix[r + dr][c + dc] = isEdge || isDot;
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark module
  matrix[size - 8][8] = true;

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 5. Place data codewords
  let codewordIdx = 0;
  let bitIdx = 7;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    for (let count = 0; count < size; count++) {
      const row = upwards ? size - 1 - count : count;

      for (let col = right; col >= right - 1; col--) {
        if (matrix[row][col] === null) {
          let bit = 0;
          if (codewordIdx < finalCodewords.length) {
            bit = (finalCodewords[codewordIdx] >>> bitIdx) & 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              codewordIdx++;
            }
          }

          // Apply Mask Pattern 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 6. Write Format Info (Level L = 01, Mask 0 = 000 -> 01000 with BCH generator 0x537)
  // Format bits for L-Mask0 after XOR mask 0x5412 = 111011111000100
  // Index 0 is MSB (bit 14), Index 14 is LSB (bit 0)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  // Top-left:
  // Row 8: (8,0)=bit14, (8,1)=bit13, (8,2)=bit12, (8,3)=bit11, (8,4)=bit10, (8,5)=bit9, (8,7)=bit8, (8,8)=bit7
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  // Col 8: (7,8)=bit6, (5,8)=bit5, (4,8)=bit4, (3,8)=bit3, (2,8)=bit2, (1,8)=bit1, (0,8)=bit0
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  // Bottom-left:
  // Col 8, row (size-7) down to row (size-1) are bits 6 down to 0:
  // (size-7, 8)=bit6, (size-6, 8)=bit5, ..., (size-1, 8)=bit0
  for (let i = 0; i < 7; i++) {
    matrix[size - 7 + i][8] = formatBits[8 + i] === 1;
  }

  // Top-right:
  // Row 8, col (size-8) to col (size-1) are bits 7 to 14:
  // (8, size-8)=bit7, (8, size-7)=bit8, ..., (8, size-1)=bit14
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 - i] === 1;
  }

  return matrix.map(row => row.map(cell => Boolean(cell)));
}

export function generateQrSvg(text: string, moduleSize = 8, margin = 4): string {
  const matrix = generateQrMatrix(text);
  const numModules = matrix.length;
  const viewBoxSize = numModules + margin * 2;
  const pixelSize = viewBoxSize * moduleSize;

  let rects = '';
  for (let r = 0; r < numModules; r++) {
    for (let c = 0; c < numModules; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="#00f0ff"/>`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#07090e" rx="6"/>
      ${rects}
    </svg>
  `;
}
