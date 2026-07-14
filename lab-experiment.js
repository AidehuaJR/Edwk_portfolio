const canvas = document.getElementById("experiment-canvas");
const mode = document.body.dataset.experiment || "terrain";
const ctx = canvas.getContext("2d");
const pointer = { x: 0.5, y: 0.5, active: false };

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resize);
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - rect.left) / rect.width;
  pointer.y = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
});
canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

function draw(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8edca";
  ctx.fillRect(0, 0, width, height);

  if (mode === "command") {
    drawCommand(width, height, time);
  } else if (mode === "robot") {
    drawRobot(width, height, time);
  } else {
    drawTerrain(width, height, time);
  }

  requestAnimationFrame(draw);
}

function drawTerrain(width, height, time) {
  const t = time * 0.001;
  const rows = 24;
  const cols = 32;
  ctx.lineWidth = 1;

  for (let row = 0; row < rows; row += 1) {
    const y = (row / (rows - 1)) * height;
    ctx.beginPath();
    for (let col = 0; col < cols; col += 1) {
      const x = (col / (cols - 1)) * width;
      const dx = col / cols - pointer.x;
      const dy = row / rows - pointer.y;
      const pulse = Math.sin(col * 0.55 + row * 0.4 + t * 2.2) * 12;
      const cursorWave = Math.cos(Math.sqrt(dx * dx + dy * dy) * 18 - t * 5) * 16;
      const yy = y + pulse + cursorWave * (pointer.active ? 1 : 0.25);
      if (col === 0) {
        ctx.moveTo(x, yy);
      } else {
        ctx.lineTo(x, yy);
      }
    }
    ctx.strokeStyle = row % 4 === 0 ? "rgba(111,113,50,0.72)" : "rgba(21,40,34,0.18)";
    ctx.stroke();
  }
}

function drawCommand(width, height, time) {
  const t = time * 0.001;
  const nodes = [
    { x: 0.2, y: 0.32, label: "HQ" },
    { x: 0.44, y: 0.24, label: "A1" },
    { x: 0.68, y: 0.42, label: "B2" },
    { x: 0.36, y: 0.66, label: "SIM" },
    { x: 0.78, y: 0.72, label: "OBJ" }
  ];

  ctx.strokeStyle = "rgba(21,40,34,0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.lineWidth = 2;
  nodes.forEach((node, index) => {
    const next = nodes[(index + 1) % nodes.length];
    ctx.strokeStyle = index % 2 ? "rgba(111,113,50,0.7)" : "rgba(175,163,74,0.8)";
    ctx.beginPath();
    ctx.moveTo(node.x * width, node.y * height);
    ctx.lineTo(next.x * width, next.y * height);
    ctx.stroke();
  });

  nodes.forEach((node, index) => {
    const x = node.x * width + Math.sin(t + index) * 8;
    const y = node.y * height + Math.cos(t * 0.8 + index) * 8;
    ctx.fillStyle = index === 0 ? "#152822" : "#6f7132";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2e6c0";
    ctx.font = "700 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, x, y);
  });
}

function drawRobot(width, height, time) {
  const t = time * 0.001;
  const cx = width * (0.52 + (pointer.x - 0.5) * 0.1);
  const cy = height * 0.48;
  const glow = 32 + Math.sin(t * 3) * 8;

  const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.62);
  gradient.addColorStop(0, "rgba(175,163,74,0.38)");
  gradient.addColorStop(0.45, "rgba(111,113,50,0.18)");
  gradient.addColorStop(1, "rgba(248,237,202,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#6f7132";
  ctx.beginPath();
  ctx.moveTo(width * 0.18, height * 0.82);
  ctx.lineTo(width * 0.35, height * 0.42);
  ctx.lineTo(width * 0.5, height * 0.82);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#152822";
  ctx.fillRect(cx - 62, cy - 44, 124, 88);
  ctx.fillStyle = "#afa34a";
  ctx.fillRect(cx - 44, cy - 26, 88, 52);
  ctx.strokeStyle = "#f2e6c0";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, glow, 0, Math.PI * 2);
  ctx.stroke();

  for (let arm = 0; arm < 4; arm += 1) {
    const angle = t * 0.9 + arm * Math.PI * 0.5;
    ctx.strokeStyle = arm % 2 ? "#152822" : "#6f7132";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 120, cy + Math.sin(angle) * 80);
    ctx.stroke();
  }
}

resize();
requestAnimationFrame(draw);
