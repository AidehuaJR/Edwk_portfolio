const canvas = document.getElementById("experiment-canvas");
const mode = document.body.dataset.experiment || "terrain";
const ctx = canvas.getContext("2d");
const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function drawBackground(width, height, time) {
  const t = time * 0.001;
  const gradient = ctx.createRadialGradient(
    width * (0.42 + (pointer.x - 0.5) * 0.18),
    height * (0.38 + (pointer.y - 0.5) * 0.18),
    20,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.76
  );
  gradient.addColorStop(0, "rgba(175,163,74,0.28)");
  gradient.addColorStop(0.42, "rgba(111,113,50,0.12)");
  gradient.addColorStop(1, "rgba(8,18,15,1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(242,230,192,0.05)";
  ctx.lineWidth = 1;
  for (let x = -40 + (t * 10) % 40; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.22, height);
    ctx.stroke();
  }
}

window.addEventListener("resize", resize);
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.tx = (event.clientX - rect.left) / rect.width;
  pointer.ty = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
});
canvas.addEventListener("pointerleave", () => {
  pointer.tx = 0.5;
  pointer.ty = 0.5;
  pointer.active = false;
});

function draw(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  pointer.x = lerp(pointer.x, pointer.tx, 0.08);
  pointer.y = lerp(pointer.y, pointer.ty, 0.08);

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height, time);

  if (mode === "command") {
    drawCommand(width, height, time);
  } else if (mode === "robot") {
    drawRobot(width, height, time);
  } else {
    drawTerrain(width, height, time);
  }

  requestAnimationFrame(draw);
}

function drawCommand(width, height, time) {
  const t = time * 0.001;
  const nodes = [
    { x: 0.18, y: 0.34, label: "HQ", r: 25 },
    { x: 0.42, y: 0.24, label: "A1", r: 20 },
    { x: 0.67, y: 0.38, label: "B2", r: 20 },
    { x: 0.36, y: 0.68, label: "SIM", r: 23 },
    { x: 0.78, y: 0.7, label: "OBJ", r: 22 }
  ];

  ctx.save();
  ctx.translate((pointer.x - 0.5) * 26, (pointer.y - 0.5) * 18);

  for (let ring = 0; ring < 5; ring += 1) {
    ctx.strokeStyle = `rgba(242,230,192,${0.08 - ring * 0.01})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.52, 130 + ring * 56, 74 + ring * 34, -0.12, 0, Math.PI * 2);
    ctx.stroke();
  }

  nodes.forEach((node, index) => {
    const next = nodes[(index + 1) % nodes.length];
    const x1 = node.x * width;
    const y1 = node.y * height;
    const x2 = next.x * width;
    const y2 = next.y * height;
    const pulse = (Math.sin(t * 2.2 + index) + 1) / 2;

    ctx.strokeStyle = "rgba(242,230,192,0.12)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = index % 2 ? "rgba(175,163,74,0.92)" : "rgba(242,230,192,0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = -time * 0.035 - index * 20;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    const px = lerp(x1, x2, pulse);
    const py = lerp(y1, y2, pulse);
    ctx.fillStyle = "#f2e6c0";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  nodes.forEach((node, index) => {
    const x = node.x * width + Math.sin(t * 0.8 + index) * 9;
    const y = node.y * height + Math.cos(t * 0.7 + index) * 9;
    const hover = Math.hypot(pointer.x - node.x, pointer.y - node.y);
    const scale = hover < 0.18 ? 1.18 : 1;

    ctx.fillStyle = "rgba(8,18,15,0.46)";
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 18, node.r * 1.28 * scale, node.r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = index === 0 ? "#f2e6c0" : "#afa34a";
    ctx.beginPath();
    ctx.arc(x, y, node.r * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#152822";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#152822";
    ctx.font = "800 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, x, y);
  });

  ctx.restore();
}

function projectTerrainPoint(x, z, y, width, height) {
  const perspective = 0.74 + z * 0.022;
  return {
    x: width * 0.5 + x * perspective + (pointer.x - 0.5) * 48,
    y: height * 0.64 + z * 12 - y * 30 + (pointer.y - 0.5) * 28
  };
}

function drawTerrain(width, height, time) {
  const t = time * 0.001;
  const rows = 30;
  const cols = 38;
  const spacingX = Math.min(width / 18, 34);
  const originZ = -16;

  ctx.save();
  ctx.translate(0, -height * 0.04);

  for (let row = 0; row < rows; row += 1) {
    const z = originZ + row;
    ctx.beginPath();
    for (let col = 0; col < cols; col += 1) {
      const x = (col - cols / 2) * spacingX;
      const nx = col / cols - pointer.x;
      const nz = row / rows - pointer.y;
      const distance = Math.sqrt(nx * nx + nz * nz);
      const y =
        Math.sin(col * 0.45 + t * 1.6) * 0.32 +
        Math.cos(row * 0.48 + t * 1.15) * 0.34 +
        Math.cos(distance * 18 - t * 4.4) * (pointer.active ? 0.58 : 0.22);
      const point = projectTerrainPoint(x, z, y, width, height);
      if (col === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.strokeStyle = row % 5 === 0 ? "rgba(242,230,192,0.62)" : "rgba(175,163,74,0.26)";
    ctx.lineWidth = row % 5 === 0 ? 1.5 : 1;
    ctx.stroke();
  }

  for (let col = 0; col < cols; col += 3) {
    ctx.beginPath();
    for (let row = 0; row < rows; row += 1) {
      const z = originZ + row;
      const x = (col - cols / 2) * spacingX;
      const y = Math.sin(col * 0.45 + t * 1.6) * 0.32 + Math.cos(row * 0.48 + t * 1.15) * 0.34;
      const point = projectTerrainPoint(x, z, y, width, height);
      if (row === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.strokeStyle = "rgba(242,230,192,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const scanY = height * (0.36 + ((t * 0.08) % 0.34));
  const gradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  gradient.addColorStop(0, "rgba(242,230,192,0)");
  gradient.addColorStop(0.5, "rgba(242,230,192,0.26)");
  gradient.addColorStop(1, "rgba(242,230,192,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, scanY - 30, width, 60);

  ctx.restore();
}

function drawRobot(width, height, time) {
  const t = time * 0.001;
  const cx = width * (0.52 + (pointer.x - 0.5) * 0.08);
  const cy = height * (0.5 + (pointer.y - 0.5) * 0.05);
  const heat = (Math.sin(t * 2.4) + 1) / 2;

  const lava = ctx.createRadialGradient(width * 0.36, height * 0.78, 20, width * 0.36, height * 0.78, width * 0.52);
  lava.addColorStop(0, "rgba(214,143,74,0.56)");
  lava.addColorStop(0.34, "rgba(175,163,74,0.2)");
  lava.addColorStop(1, "rgba(8,18,15,0)");
  ctx.fillStyle = lava;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#2a1b12";
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.9);
  ctx.lineTo(width * 0.29, height * 0.42);
  ctx.lineTo(width * 0.48, height * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(214,143,74,${0.34 + heat * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(width * 0.25, height * 0.76);
  ctx.lineTo(width * 0.31, height * 0.49);
  ctx.lineTo(width * 0.38, height * 0.76);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 22; i += 1) {
    const angle = i * 0.9 + t * 0.5;
    const radius = 60 + i * 6;
    const x = width * 0.32 + Math.cos(angle) * radius * 0.28;
    const y = height * 0.48 - i * 8 - (t * 34 + i * 11) % 130;
    ctx.fillStyle = `rgba(242,230,192,${0.08 + (i % 4) * 0.025})`;
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((pointer.x - 0.5) * 0.16);

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 116, 118, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let arm = 0; arm < 4; arm += 1) {
    const side = arm < 2 ? -1 : 1;
    const y = arm % 2 === 0 ? -18 : 22;
    const reach = 84 + Math.sin(t * 1.4 + arm) * 12;
    ctx.strokeStyle = arm % 2 ? "#afa34a" : "#f2e6c0";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(side * 52, y);
    ctx.quadraticCurveTo(side * reach, y + Math.sin(t + arm) * 26, side * (reach + 46), y + 56);
    ctx.stroke();
    ctx.fillStyle = "#152822";
    ctx.beginPath();
    ctx.arc(side * (reach + 46), y + 56, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  const bodyGradient = ctx.createLinearGradient(-70, -70, 70, 82);
  bodyGradient.addColorStop(0, "#f2e6c0");
  bodyGradient.addColorStop(0.48, "#afa34a");
  bodyGradient.addColorStop(1, "#6f7132");
  ctx.fillStyle = bodyGradient;
  roundRect(-72, -66, 144, 132, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(242,230,192,0.62)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#152822";
  roundRect(-42, -26, 84, 46, 16);
  ctx.fill();

  ctx.fillStyle = "#f2e6c0";
  ctx.beginPath();
  ctx.arc(-18, -3, 7 + heat * 3, 0, Math.PI * 2);
  ctx.arc(18, -3, 7 + heat * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(242,230,192,${0.45 + heat * 0.28})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 88 + heat * 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

resize();
requestAnimationFrame(draw);
