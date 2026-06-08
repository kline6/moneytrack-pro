const fs = require("fs");
const path = require("path");

// Create a valid 192x192 blue PNG icon
function createPNG(width, height, r, g, b) {
  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk("IHDR", ihdrData);
  
  // IDAT chunk - raw image data with zlib
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }
  
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk("IDAT", compressed);
  
  // IEND chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const assetsDir = "E:\\项目合集\\理财app\\apps\\mobile\\assets";

// 192x192 blue icon
fs.writeFileSync(path.join(assetsDir, "icon.png"), createPNG(192, 192, 59, 130, 246));
console.log("icon.png (192x192) created");

fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), createPNG(192, 192, 59, 130, 246));
console.log("adaptive-icon.png (192x192) created");

fs.writeFileSync(path.join(assetsDir, "splash.png"), createPNG(1284, 2778, 15, 23, 42));
console.log("splash.png created");

fs.writeFileSync(path.join(assetsDir, "favicon.png"), createPNG(48, 48, 59, 130, 246));
console.log("favicon.png created");
