// Minimal ICO encoder.
//
// Frames smaller than 256 px are stored as 32-bit BGRA DIBs with a 1-bit AND
// mask (the most widely compatible form: Win32 resource compiler,
// System.Drawing.Icon, Explorer). The 256 px frame is stored
// as PNG, which Windows has accepted since Vista and keeps the file small.

/**
 * @param {{ size: number, png: Buffer, data: Buffer, width: number, height: number }[]} frames
 *   `data` is straight (non-premultiplied) RGBA, row-major, top-down.
 * @returns {Buffer}
 */
export function encodeIco(frames) {
  const sorted = [...frames].sort((a, b) => a.size - b.size);
  const images = sorted.map((f) => (f.size >= 256 ? f.png : toDib(f)));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sorted.length, 4);

  const dir = Buffer.alloc(16 * sorted.length);
  let offset = header.length + dir.length;
  sorted.forEach((f, i) => {
    const e = i * 16;
    dir.writeUInt8(f.width >= 256 ? 0 : f.width, e + 0);
    dir.writeUInt8(f.height >= 256 ? 0 : f.height, e + 1);
    dir.writeUInt8(0, e + 2); // palette colours
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // colour planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(images[i].length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });

  return Buffer.concat([header, dir, ...images]);
}

function toDib({ data, width, height }) {
  const xorStride = width * 4;
  const andStride = Math.ceil(width / 32) * 4;
  const xorSize = xorStride * height;
  const andSize = andStride * height;

  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4);
  bih.writeInt32LE(height * 2, 8); // XOR + AND masks
  bih.writeUInt16LE(1, 12); // planes
  bih.writeUInt16LE(32, 14); // bit count
  bih.writeUInt32LE(0, 16); // BI_RGB
  bih.writeUInt32LE(xorSize + andSize, 20);

  const xor = Buffer.alloc(xorSize);
  const and = Buffer.alloc(andSize);
  for (let y = 0; y < height; y++) {
    const dstRow = height - 1 - y; // DIBs are bottom-up
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = dstRow * xorStride + x * 4;
      xor[d + 0] = data[s + 2];
      xor[d + 1] = data[s + 1];
      xor[d + 2] = data[s + 0];
      xor[d + 3] = data[s + 3];
      if (data[s + 3] === 0) and[dstRow * andStride + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return Buffer.concat([bih, xor, and]);
}
