const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const palette = {
  paper: [244, 243, 238, 255],
  coral: [219, 105, 73, 255],
  sun: [228, 184, 79, 255],
  green: [108, 154, 120, 255],
};

const insidePolygon = (x, y, points) => {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index += 1) {
    const [xi, yi] = points[index];
    const [xj, yj] = points[previous];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const ratio = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  const x = ax + ratio * dx;
  const y = ay + ratio * dy;
  return Math.hypot(px - x, py - y);
};

const renderIcon = (size) => {
  const png = new PNG({ width: size, height: size });
  const scale = size / 1024;
  const color = (rgba) => rgba;
  const setPixel = (x, y, rgba) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (size * y + x) << 2;
    png.data[offset] = rgba[0];
    png.data[offset + 1] = rgba[1];
    png.data[offset + 2] = rgba[2];
    png.data[offset + 3] = rgba[3];
  };
  const fillCircle = (cx, cy, radius, rgba) => {
    const min = Math.max(0, Math.floor((cy - radius) * scale));
    const max = Math.min(size - 1, Math.ceil((cy + radius) * scale));
    for (let y = min; y <= max; y += 1) {
      for (let x = Math.max(0, Math.floor((cx - radius) * scale)); x <= Math.min(size - 1, Math.ceil((cx + radius) * scale)); x += 1) {
        if (Math.hypot(x / scale - cx, y / scale - cy) <= radius) setPixel(x, y, rgba);
      }
    }
  };
  const fillPolygon = (points, rgba) => {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    for (let y = Math.max(0, Math.floor(Math.min(...ys) * scale)); y <= Math.min(size - 1, Math.ceil(Math.max(...ys) * scale)); y += 1) {
      for (let x = Math.max(0, Math.floor(Math.min(...xs) * scale)); x <= Math.min(size - 1, Math.ceil(Math.max(...xs) * scale)); x += 1) {
        if (insidePolygon(x / scale, y / scale, points)) setPixel(x, y, rgba);
      }
    }
  };
  const stroke = (points, width, rgba) => {
    for (let index = 0; index < points.length - 1; index += 1) {
      const [ax, ay] = points[index];
      const [bx, by] = points[index + 1];
      const minX = Math.max(0, Math.floor((Math.min(ax, bx) - width) * scale));
      const maxX = Math.min(size - 1, Math.ceil((Math.max(ax, bx) + width) * scale));
      const minY = Math.max(0, Math.floor((Math.min(ay, by) - width) * scale));
      const maxY = Math.min(size - 1, Math.ceil((Math.max(ay, by) + width) * scale));
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          if (distanceToSegment(x / scale, y / scale, ax, ay, bx, by) <= width / 2) setPixel(x, y, rgba);
        }
      }
    }
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(x, y, color(palette.paper));
  }
  fillCircle(340, 350, 86, palette.coral);
  fillCircle(684, 350, 86, palette.sun);
  fillCircle(512, 672, 164, palette.green);
  fillPolygon([[512, 420], [555, 472], [581, 525], [573, 568], [543, 598], [512, 606], [479, 594], [452, 563], [446, 525], [461, 480]], palette.coral);
  fillPolygon([[512, 465], [535, 505], [540, 542], [513, 566], [486, 542], [487, 512]], palette.sun);
  stroke([[456, 678], [498, 719], [578, 628]], 31, palette.paper);

  return PNG.sync.write(png);
};

const imageDir = path.resolve(__dirname, '..', 'assets', 'images');
fs.writeFileSync(path.join(imageDir, 'icon-momdaily.png'), renderIcon(1024));
fs.writeFileSync(path.join(imageDir, 'favicon-momdaily.png'), renderIcon(48));
console.log('Generated MomDaily icon assets.');
