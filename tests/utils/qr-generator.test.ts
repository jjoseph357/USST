import { describe, it, expect } from 'vitest';
import { generateQrMatrix, generateQrSvg } from '../../src/utils/qr-generator';

describe('QR generator utility', () => {
  it('generates a square boolean matrix with valid finder pattern size', () => {
    const url = 'https://usst.ca/avionics';
    const matrix = generateQrMatrix(url);

    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0].length).toBe(matrix.length);

    // Top-left finder pattern check (7x7)
    // Center of finder should be true (rows 2-4, cols 2-4)
    expect(matrix[2][2]).toBe(true);
    expect(matrix[2][3]).toBe(true);
    expect(matrix[2][4]).toBe(true);
    expect(matrix[3][3]).toBe(true);

    // Corner module should be true
    expect(matrix[0][0]).toBe(true);
  });

  it('renders a valid SVG string containing SVG and rect tags', () => {
    const svg = generateQrSvg('https://usst.ca');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<rect');
    expect(svg).toContain('fill="#00f0ff"');
  });

  it('guarantees redundant format bits in bottom-left and top-right exactly match top-left format bits', () => {
    const matrix = generateQrMatrix('https://usst.ca/avionics');
    const size = matrix.length;

    // Top-left format bits (bit 14 down to 0):
    // (8,0)=14, (8,1)=13, (8,2)=12, (8,3)=11, (8,4)=10, (8,5)=9, (8,7)=8, (8,8)=7
    // (7,8)=6, (5,8)=5, (4,8)=4, (3,8)=3, (2,8)=2, (1,8)=1, (0,8)=0
    const coordsTL = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    const bitsTL = coordsTL.map(([r, c]) => matrix[r][c] ? 1 : 0);

    // Redundant format bits (bit 14 down to 0):
    // Row 8: (8, size-1)=14 down to (8, size-8)=7
    // Col 8: (size-7, 8)=6 down to (size-1, 8)=0
    const coordsRedundant = [
      [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4],
      [8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8],
      [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
      [size - 3, 8], [size - 2, 8], [size - 1, 8]
    ];
    const bitsRedundant = coordsRedundant.map(([r, c]) => matrix[r][c] ? 1 : 0);

    // Format bits must match bit-for-bit to allow reliable barcode scanning
    expect(bitsRedundant).toEqual(bitsTL);
  });

  it('generates up to Version 6 for longer URLs and throws on excess length', () => {
    // 120-character URL
    const longUrl = 'https://usst.ca/avionics/recruitment-showcase/2026-2027/launch-canada-stm32-flight-computer-zephyr-rtos-ukf-telemetry-portal';
    const matrix = generateQrMatrix(longUrl);
    expect(matrix.length).toBe(41); // Version 6 is 41x41

    // Exceeding capacity should throw descriptive error
    const tooLong = 'A'.repeat(200);
    expect(() => generateQrMatrix(tooLong)).toThrow(/exceeds maximum supported QR capacity/);
  });
});
