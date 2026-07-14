import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("jake-lab-canvas");
const titleElement = document.getElementById("jake-lab-title");
const copyElement = document.getElementById("jake-lab-copy");
const tagElement = document.getElementById("jake-lab-tag");
const buttons = Array.from(document.querySelectorAll("[data-value]"));

const valueData = {
  impact: {
    tag: "01 / Business Impact",
    title: "Impact Garden",
    copy: "Turn a playful idea into something people can use. The growing blocks show how small design choices can become visible outcomes.",
    target: new THREE.Vector3(-3.6, 0.2, 1.6)
  },
  curiosity: {
    tag: "02 / Curiosity",
    title: "Curiosity Desk",
    copy: "Ask better questions, test strange prototypes, and keep the learning loop visible. The lens and orbiting ideas react when you explore.",
    target: new THREE.Vector3(3.2, 1.15, 0.85)
  },
  solving: {
    tag: "03 / Problem Solving",
    title: "Puzzle Path",
    copy: "Break messy problems into pieces, test a route, then rebuild the system with clearer logic. The blocks snap into a readable path.",
    target: new THREE.Vector3(-2.5, -0.45, -2.65)
  },
  quality: {
    tag: "04 / Code Quality",
    title: "Clean Code Stack",
    copy: "Readable structure matters. The code tiles show modular thinking, careful naming, and maintainable details.",
    target: new THREE.Vector3(2.75, -0.35, -2.5)
  },
  communication: {
    tag: "05 / Technical Communication",
    title: "Clarity Bubbles",
    copy: "Strong work becomes stronger when it can be explained. The speech cards turn technical thinking into clear language.",
    target: new THREE.Vector3(0, 2.35, -2.85)
  }
};

const colors = {
  cream: 0xf2e6c0,
  surface: 0xf8edca,
  avocado: 0xafa34a,
  moss: 0x6f7132,
  coal: 0x152822,
  warm: 0xd68f4a,
  pit: 0x5b351d,
  white: 0xfff7dc
};

let activeKey = normalizeHash() || "impact";

if (canvas) {
  initLab();
}

function initLab() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf2e6c0, 0.024);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 3.6, 12);

  const rig = new THREE.Group();
  scene.add(rig);

  scene.add(new THREE.HemisphereLight(0xfff3cc, 0x22372f, 2.5));

  const keyLight = new THREE.DirectionalLight(0xfff2ca, 4.2);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1536, 1536);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xafa34a, 1.5);
  rimLight.position.set(-6, 3, -4);
  scene.add(rimLight);

  const warmLight = new THREE.PointLight(0xd68f4a, 2.4, 18);
  warmLight.position.set(-3.5, 1, 4);
  scene.add(warmLight);

  const floor = createFloor();
  rig.add(floor);

  const jake = createJake();
  rig.add(jake.group);

  const valueGroups = {
    impact: createImpactGarden(),
    curiosity: createCuriosityDesk(),
    solving: createPuzzlePath(),
    quality: createCodeStack(),
    communication: createCommunicationBubbles()
  };

  Object.entries(valueGroups).forEach(([key, group]) => {
    group.traverse((child) => {
      child.userData.valueKey = key;
    });
    rig.add(group);
  });

  const constellations = createConstellations();
  rig.add(constellations.group);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, dragging: false, lastX: 0, lastY: 0 };
  let manualRotation = 0;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setActive(button.dataset.value || "impact", true);
    });
  });

  window.addEventListener("hashchange", () => {
    setActive(normalizeHash() || "impact", false);
  });

  canvas.addEventListener("pointerdown", (event) => {
    pointer.dragging = true;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    selectFromPointer(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    if (pointer.dragging) {
      manualRotation += (event.clientX - pointer.lastX) * 0.006;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    pointer.dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.tx = 0;
    pointer.ty = 0;
    pointer.dragging = false;
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement || canvas);
  resize();
  setActive(activeKey, false);

  renderer.setAnimationLoop((elapsedMs) => {
    const time = elapsedMs * 0.001;
    pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty, 0.06);

    rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, manualRotation + pointer.x * 0.14, 0.04);
    rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, -pointer.y * 0.05, 0.04);

    jake.update(time, activeKey);
    updateValueGroups(valueGroups, time);
    updateConstellations(constellations, time);

    const activeTarget = valueData[activeKey].target;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, activeTarget.x * 0.18 + pointer.x * 0.7, 0.035);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.45 + activeTarget.y * 0.1 - pointer.y * 0.35, 0.035);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 11.6, 0.035);
    camera.lookAt(activeTarget.x * 0.08, 0.25 + activeTarget.y * 0.06, 0);

    renderer.render(scene, camera);
  });

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function selectFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(rig.children, true);
    const hit = hits.find((item) => item.object.userData.valueKey);
    if (hit) {
      setActive(hit.object.userData.valueKey, true);
    }
  }

  function setActive(key, writeHash) {
    if (!valueData[key]) {
      key = "impact";
    }
    activeKey = key;

    const data = valueData[key];
    if (titleElement) titleElement.textContent = data.title;
    if (copyElement) copyElement.textContent = data.copy;
    if (tagElement) tagElement.textContent = data.tag;

    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === key);
    });

    Object.entries(valueGroups).forEach(([groupKey, group]) => {
      group.userData.active = groupKey === key;
    });

    if (writeHash) {
      history.replaceState(null, "", `#${key === "quality" ? "craft" : key}`);
    }
  }
}

function normalizeHash() {
  const hash = window.location.hash.replace("#", "").trim();
  if (hash === "craft") return "quality";
  return valueData[hash] ? hash : "";
}

function createJake() {
  const group = new THREE.Group();
  group.position.set(0, 0.15, 0.2);

  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 48, 48),
    material(colors.moss, { roughness: 0.58, metalness: 0.04 })
  );
  outer.scale.set(0.78, 1.2, 0.46);
  outer.castShadow = true;
  outer.receiveShadow = true;
  group.add(outer);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 48, 48),
    material(0xe4df67, { roughness: 0.62, metalness: 0.03 })
  );
  face.position.z = 0.25;
  face.scale.set(0.74, 1.05, 0.26);
  face.castShadow = true;
  group.add(face);

  const pit = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 32),
    material(colors.pit, { roughness: 0.42, metalness: 0.06 })
  );
  pit.position.set(0.12, 0.18, 0.68);
  pit.scale.set(1, 1.05, 0.42);
  pit.castShadow = true;
  group.add(pit);

  const ears = [
    { x: -0.58, rotation: 0.32 },
    { x: 0.58, rotation: -0.32 }
  ].map((item) => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.64, 4),
      material(colors.moss, { roughness: 0.56 })
    );
    ear.position.set(item.x, 1.35, 0.06);
    ear.rotation.set(0.08, item.rotation, Math.sign(-item.x) * 0.35);
    ear.castShadow = true;
    group.add(ear);
    return ear;
  });

  const eyeMaterial = material(0x050606, { roughness: 0.22, metalness: 0.04 });
  const eyes = [-0.43, 0.43].map((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 24), eyeMaterial);
    eye.position.set(x, -0.02, 0.76);
    eye.scale.set(1, 1, 0.32);
    group.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), material(colors.white, { roughness: 0.2 }));
    shine.position.set(x - 0.035, 0.025, 0.795);
    shine.scale.set(1, 1, 0.4);
    group.add(shine);
    return eye;
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.025, 10, 40, Math.PI),
    eyeMaterial
  );
  smile.position.set(0, -0.34, 0.78);
  smile.rotation.set(0, 0, Math.PI);
  smile.scale.set(1, 0.72, 0.35);
  group.add(smile);

  [-1, 1].forEach((side) => {
    for (let index = 0; index < 3; index += 1) {
      const whisker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.52, 10),
        material(colors.coal, { roughness: 0.35 })
      );
      whisker.position.set(side * 0.52, -0.22 + index * 0.09, 0.72);
      whisker.rotation.set(Math.PI / 2, 0, side * (1.1 - index * 0.16));
      group.add(whisker);
    }
  });

  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.045, 14, 64, Math.PI * 1.38),
    material(colors.moss, { roughness: 0.5 })
  );
  tail.position.set(0.93, -0.24, -0.08);
  tail.rotation.set(0.8, -0.2, -1.35);
  tail.castShadow = true;
  group.add(tail);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.12, 0.12, 56),
    material(colors.cream, { roughness: 0.7, transparent: true, opacity: 0.54 })
  );
  base.position.y = -1.5;
  base.receiveShadow = true;
  group.add(base);

  return {
    group,
    update(time, activeKey) {
      const lively = activeKey === "curiosity" ? 1.18 : 1;
      group.position.y = 0.15 + Math.sin(time * 1.4) * 0.08;
      group.rotation.z = Math.sin(time * 0.75) * 0.025;
      ears.forEach((ear, index) => {
        ear.rotation.z += Math.sin(time * 2.4 + index) * 0.0015 * lively;
      });
      eyes.forEach((eye, index) => {
        eye.scale.y = 1 + Math.sin(time * 2.2 + index) * 0.03;
      });
      tail.rotation.y = -0.2 + Math.sin(time * 1.8) * 0.18;
    }
  };
}

function createImpactGarden() {
  const group = new THREE.Group();
  group.position.set(-3.6, -0.85, 1.6);
  const heights = [0.58, 0.9, 1.25, 1.65];

  heights.forEach((height, index) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, height, 0.34),
      material(index % 2 ? colors.warm : colors.avocado, { roughness: 0.5 })
    );
    bar.position.set(index * 0.46 - 0.72, height / 2, 0);
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);

    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 18),
      material(colors.moss, { roughness: 0.55 })
    );
    leaf.scale.set(1.3, 0.54, 0.7);
    leaf.position.set(bar.position.x + 0.11, height + 0.12, 0.04);
    leaf.castShadow = true;
    group.add(leaf);
  });

  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.1, 48),
    material(0xe3b65c, { roughness: 0.36, metalness: 0.18 })
  );
  coin.position.set(-1.25, 0.9, -0.2);
  coin.rotation.set(Math.PI / 2, 0.2, 0);
  coin.castShadow = true;
  group.add(coin);
  group.userData.spinner = coin;
  addLabel(group, "impact", 0, 2.05, 0);
  return group;
}

function createCuriosityDesk() {
  const group = new THREE.Group();
  group.position.set(3.2, 0.25, 0.85);

  const lens = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.045, 18, 64),
    material(colors.coal, { roughness: 0.42, metalness: 0.1 })
  );
  lens.position.y = 0.58;
  lens.rotation.set(0.28, 0.05, 0.16);
  lens.castShadow = true;
  group.add(lens);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 48),
    material(0xdff4ee, { roughness: 0.2, metalness: 0.02, transparent: true, opacity: 0.38 })
  );
  glass.position.copy(lens.position);
  glass.rotation.copy(lens.rotation);
  group.add(glass);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.82, 16),
    material(colors.coal, { roughness: 0.42 })
  );
  handle.position.set(0.42, 0.11, 0.12);
  handle.rotation.set(0.6, 0.1, -0.72);
  handle.castShadow = true;
  group.add(handle);

  const ideas = [];
  for (let index = 0; index < 7; index += 1) {
    const idea = new THREE.Mesh(
      new THREE.SphereGeometry(0.075 + index * 0.006, 16, 16),
      material(index % 2 ? colors.warm : colors.avocado, { emissive: index % 2 ? colors.warm : colors.avocado, emissiveIntensity: 0.06 })
    );
    ideas.push(idea);
    group.add(idea);
  }
  group.userData.ideas = ideas;
  addLabel(group, "curiosity", 0, 1.42, 0);
  return group;
}

function createPuzzlePath() {
  const group = new THREE.Group();
  group.position.set(-2.5, -1.1, -2.65);
  const offsets = [
    [-0.7, 0, 0.2],
    [-0.24, 0.18, -0.1],
    [0.22, 0.02, 0.16],
    [0.68, 0.24, -0.08]
  ];

  offsets.forEach((offset, index) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.32, 0.42),
      material(index % 2 ? colors.cream : colors.moss, { roughness: 0.55 })
    );
    block.position.set(...offset);
    block.rotation.y = index * 0.26;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  });

  const route = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.018, 8, 80, Math.PI * 1.38),
    material(colors.warm, { emissive: colors.warm, emissiveIntensity: 0.08 })
  );
  route.position.y = 0.12;
  route.rotation.set(Math.PI / 2, 0, -0.62);
  group.add(route);
  group.userData.route = route;
  addLabel(group, "solve", 0, 0.9, 0);
  return group;
}

function createCodeStack() {
  const group = new THREE.Group();
  group.position.set(2.75, -0.92, -2.5);

  ["modular", "tested", "clear"].forEach((text, index) => {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.1, 0.72),
      material(index === 1 ? colors.avocado : colors.surface, { roughness: 0.62 })
    );
    tile.position.set(0, index * 0.24, index * -0.05);
    tile.rotation.y = -0.18;
    tile.castShadow = true;
    tile.receiveShadow = true;
    group.add(tile);

    const label = makeTextSprite(text, 0.34, colors.coal);
    label.position.set(0, index * 0.24 + 0.13, 0.38 - index * 0.05);
    group.add(label);
  });

  const bracket = makeTextSprite("</>", 0.52, colors.moss);
  bracket.position.set(0, 1.05, 0);
  group.add(bracket);
  group.userData.bracket = bracket;
  addLabel(group, "quality", 0, 1.52, 0);
  return group;
}

function createCommunicationBubbles() {
  const group = new THREE.Group();
  group.position.set(0, 1.58, -2.85);
  const bubbleData = [
    ["why", -0.8, 0.06],
    ["how", 0, 0.28],
    ["next", 0.82, 0]
  ];

  bubbleData.forEach(([text, x, y], index) => {
    const bubble = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.42, 0.08),
      material(index === 1 ? colors.avocado : colors.surface, { roughness: 0.5 })
    );
    bubble.position.set(x, y, 0);
    bubble.castShadow = true;
    group.add(bubble);

    const label = makeTextSprite(text, 0.3, colors.coal);
    label.position.set(x, y + 0.01, 0.08);
    group.add(label);
  });

  group.userData.floaters = group.children.slice();
  addLabel(group, "explain", 0, 0.92, 0);
  return group;
}

function createConstellations() {
  const group = new THREE.Group();
  const points = [];
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(80 * 3);

  for (let index = 0; index < 80; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.2 + Math.random() * 3.5;
    const y = -0.7 + Math.random() * 3.2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
    points.push({ angle, radius, y, speed: 0.08 + Math.random() * 0.12 });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material2 = new THREE.PointsMaterial({
    color: colors.moss,
    size: 0.045,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  const stars = new THREE.Points(geometry, material2);
  group.add(stars);
  return { group, geometry, positions, points };
}

function updateValueGroups(groups, time) {
  Object.entries(groups).forEach(([key, group], groupIndex) => {
    const active = group.userData.active;
    const activeScale = active ? 1.16 : 1;
    group.scale.lerp(new THREE.Vector3(activeScale, activeScale, activeScale), 0.08);
    group.position.y += Math.sin(time * 1.6 + groupIndex) * 0.0014;

    if (group.userData.spinner) {
      group.userData.spinner.rotation.z = time * 1.4;
    }

    if (group.userData.ideas) {
      group.userData.ideas.forEach((idea, index) => {
        const angle = time * (0.9 + index * 0.04) + index * 0.9;
        idea.position.set(Math.cos(angle) * 0.8, 0.58 + Math.sin(angle * 1.2) * 0.35, Math.sin(angle) * 0.38);
      });
    }

    if (group.userData.route) {
      group.userData.route.rotation.z = -0.62 + time * 0.18;
    }

    if (group.userData.bracket) {
      group.userData.bracket.position.y = 1.05 + Math.sin(time * 1.5) * 0.08;
    }

    if (group.userData.floaters) {
      group.userData.floaters.forEach((child, index) => {
        child.rotation.z = Math.sin(time * 1.1 + index) * 0.04;
      });
    }
  });
}

function updateConstellations(data, time) {
  const array = data.positions;
  data.points.forEach((point, index) => {
    const angle = point.angle + time * point.speed;
    array[index * 3] = Math.cos(angle) * point.radius;
    array[index * 3 + 1] = point.y + Math.sin(time * 0.8 + index) * 0.08;
    array[index * 3 + 2] = Math.sin(angle) * point.radius;
  });
  data.geometry.attributes.position.needsUpdate = true;
}

function createFloor() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(7.8, 96),
    material(0xe7daa9, { roughness: 0.78, metalness: 0.02, transparent: true, opacity: 0.72 })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = -1.55;
  base.receiveShadow = true;
  group.add(base);

  const rings = [1.8, 3.4, 5.2].map((radius) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 8, 120),
      material(colors.moss, { transparent: true, opacity: 0.26 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.52;
    group.add(ring);
    return ring;
  });
  group.userData.rings = rings;
  return group;
}

function addLabel(parent, text, x, y, z) {
  const label = makeTextSprite(text, 0.38, colors.coal);
  label.position.set(x, y, z);
  parent.add(label);
}

function makeTextSprite(text, size = 0.38, color = colors.coal) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 192;
  const ctx = labelCanvas.getContext("2d");
  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.fillStyle = hexToCss(color);
  ctx.font = "800 58px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 96);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(size * 2.9, size * 1.08, 1);
  return sprite;
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.52,
    metalness: options.metalness ?? 0.06,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}
