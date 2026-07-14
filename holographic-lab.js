import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const stylesheetId = "holographic-lab-styles";
const stylesheetHref = "holographic-lab.css?v=jake-lab-33";

if (!document.getElementById(stylesheetId)) {
  const link = document.createElement("link");
  link.id = stylesheetId;
  link.rel = "stylesheet";
  link.href = stylesheetHref;
  document.head.appendChild(link);
}

const canvas = document.getElementById("holographic-lab-canvas");
const lab = document.querySelector(".interactive-lab");

if (canvas && lab) {
  initHolographicLab();
} else {
  notifyLabReady();
}

function notifyLabReady() {
  window.dispatchEvent(new CustomEvent("portfolio:lab-ready"));
}

function initHolographicLab() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf2e6c0, 0.032);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 6.2, 15);

  const rig = new THREE.Group();
  scene.add(rig);

  const terrain = createTerrain();
  rig.add(terrain.mesh);

  const vortex = createVortex();
  rig.add(vortex.group);

  const starField = createStarField();
  rig.add(starField.points);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const modeButtons = Array.from(document.querySelectorAll("[data-scene-mode]"));
  const modeTargets = {
    hybrid: { terrain: 0.62, vortex: 0.94, lines: 0.78, stars: 0.22 },
    terrain: { terrain: 0.82, vortex: 0.22, lines: 0.18, stars: 0.16 },
    vortex: { terrain: 0.16, vortex: 1, lines: 0.96, stars: 0.24 }
  };
  let mode = "hybrid";
  let isVisible = true;

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.sceneMode || "hybrid";
      modeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
    });
  });

  lab.addEventListener("pointermove", (event) => {
    const rect = lab.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    lab.style.setProperty("--lab-pointer-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    lab.style.setProperty("--lab-pointer-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });

  lab.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
    lab.style.setProperty("--lab-pointer-x", "68%");
    lab.style.setProperty("--lab-pointer-y", "38%");
  });

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
  });
  observer.observe(lab);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(lab);
  resize();
  notifyLabReady();

  renderer.setAnimationLoop((elapsedMs) => {
    if (!isVisible) {
      return;
    }

    const time = elapsedMs * 0.001;
    const speed = reducedMotion ? 0.18 : 1;
    const target = modeTargets[mode] || modeTargets.hybrid;

    pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.targetX, 0.05);
    pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.targetY, 0.05);

    rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, pointer.x * 0.16, 0.035);
    rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, pointer.y * 0.06, 0.035);

    updateTerrain(terrain, time * speed);
    updateVortex(vortex, time * speed);
    updateStarField(starField, time * speed);

    terrain.material.opacity = THREE.MathUtils.lerp(terrain.material.opacity, target.terrain, 0.055);
    vortex.pointsMaterial.opacity = THREE.MathUtils.lerp(vortex.pointsMaterial.opacity, target.vortex, 0.055);
    starField.material.opacity = THREE.MathUtils.lerp(starField.material.opacity, target.stars, 0.055);
    vortex.lineMaterials.forEach((material) => {
      material.opacity = THREE.MathUtils.lerp(material.opacity, target.lines, 0.055);
    });

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.8, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 6.2 - pointer.y * 0.8, 0.04);
    camera.lookAt(0, -0.4, 0);

    renderer.render(scene, camera);
  });

  function resize() {
    const width = Math.max(1, lab.clientWidth);
    const height = Math.max(1, lab.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(32, 18, 120, 72);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const basePositions = new Float32Array(positions.array);
  const material = new THREE.MeshBasicMaterial({
    color: 0xafa34a,
    wireframe: true,
    transparent: true,
    opacity: 0.62,
    blending: THREE.NormalBlending,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-2.4, -2.75, 0.5);
  mesh.rotation.z = -0.05;

  return { basePositions, geometry, material, mesh, positions };
}

function updateTerrain(terrain, time) {
  const values = terrain.positions.array;
  const base = terrain.basePositions;

  for (let index = 0; index < values.length; index += 3) {
    const x = base[index];
    const z = base[index + 2];
    const distance = Math.sqrt(x * x + z * z);
    const wave =
      Math.sin(x * 0.72 + time * 1.2) * 0.38 +
      Math.cos(z * 1.08 + time * 0.85) * 0.34 +
      Math.sin((x + z) * 0.34 + time * 0.7) * 0.28;
    const ridge = Math.cos(distance * 0.62 - time * 1.1) * 0.16;

    values[index + 1] = wave + ridge;
  }

  terrain.positions.needsUpdate = true;
}

function createVortex() {
  const group = new THREE.Group();
  group.position.set(6.6, -0.65, -1.1);
  group.rotation.z = -0.1;

  const particleCount = 980;
  const positions = new Float32Array(particleCount * 3);
  const seeds = [];

  for (let index = 0; index < particleCount; index += 1) {
    seeds.push({
      angle: Math.random() * Math.PI * 2,
      height: Math.random(),
      radius: 0.25 + Math.random() * 2.8,
      speed: 0.6 + Math.random() * 1.2
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x152822,
    size: 0.078,
    transparent: true,
    opacity: 0.94,
    blending: THREE.NormalBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, pointsMaterial);
  group.add(points);

  const lineMaterials = [];
  const lines = [];
  const armCount = 6;
  const pointsPerArm = 150;

  for (let arm = 0; arm < armCount; arm += 1) {
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pointsPerArm * 3), 3)
    );

    const material = new THREE.LineBasicMaterial({
      color: arm % 2 === 0 ? 0x6f7132 : 0x152822,
      transparent: true,
      opacity: 0.78,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const line = new THREE.Line(lineGeometry, material);
    group.add(line);
    lineMaterials.push(material);
    lines.push({ arm, line, pointsPerArm });
  }

  return { geometry, group, lineMaterials, lines, pointsMaterial, positions, seeds };
}

function updateVortex(vortex, time) {
  const positions = vortex.positions;

  vortex.seeds.forEach((seed, index) => {
    const vertical = seed.height;
    const y = vertical * 8.2 - 3.9;
    const taper = 1 - vertical * 0.7;
    const radius = (seed.radius * taper + 0.18) * (1 + Math.sin(time * 1.4 + seed.angle) * 0.06);
    const angle = seed.angle + vertical * 11.5 + time * seed.speed;
    const offset = index * 3;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = y;
    positions[offset + 2] = Math.sin(angle) * radius;
  });

  vortex.geometry.attributes.position.needsUpdate = true;

  vortex.lines.forEach(({ arm, line, pointsPerArm }) => {
    const values = line.geometry.attributes.position.array;
    const armOffset = (arm / vortex.lines.length) * Math.PI * 2;

    for (let point = 0; point < pointsPerArm; point += 1) {
      const progress = point / (pointsPerArm - 1);
      const y = progress * 8.2 - 3.9;
      const radius = 2.45 * (1 - progress * 0.74) + 0.18;
      const angle = progress * 15 + time * 1.35 + armOffset;
      const index = point * 3;

      values[index] = Math.cos(angle) * radius;
      values[index + 1] = y;
      values[index + 2] = Math.sin(angle) * radius;
    }

    line.geometry.attributes.position.needsUpdate = true;
  });
}

function createStarField() {
  const count = 340;
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (Math.random() - 0.5) * 34;
    positions[offset + 1] = Math.random() * 10 - 2;
    positions[offset + 2] = (Math.random() - 0.5) * 22;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x152822,
    size: 0.035,
    transparent: true,
    opacity: 0.18,
    blending: THREE.NormalBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.position.z = -2;

  return { material, points };
}

function updateStarField(starField, time) {
  starField.points.rotation.y = time * 0.025;
  starField.points.rotation.x = Math.sin(time * 0.2) * 0.02;
}
