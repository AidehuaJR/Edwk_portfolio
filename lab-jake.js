import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("jake-lab-canvas");
const titleElement = document.getElementById("jake-lab-title");
const copyElement = document.getElementById("jake-lab-copy");
const tagElement = document.getElementById("jake-lab-tag");
const proofElements = [
  document.getElementById("jake-lab-proof-a"),
  document.getElementById("jake-lab-proof-b"),
  document.getElementById("jake-lab-proof-c")
];
const buttons = Array.from(document.querySelectorAll("[data-value]"));

const valueData = {
  impact: {
    tag: "01 / Business Impact",
    title: "Candy Impact Garden",
    copy: "Turn a playful idea into something people can use. Candy towers, coins, and sprouting metrics show how small design choices can become visible outcomes.",
    proof: ["Outcome thinking", "Interaction design", "User value"],
    target: new THREE.Vector3(-3.6, 0.2, 1.6),
    focusRotation: 0.8
  },
  curiosity: {
    tag: "02 / Curiosity",
    title: "Question Portal",
    copy: "Ask better questions, test strange prototypes, and keep the learning loop visible. A portal lens and orbiting idea charms react when you explore.",
    proof: ["Fast learning", "Prototype mindset", "Visual inquiry"],
    target: new THREE.Vector3(3.2, 1.15, 0.85),
    focusRotation: -0.9
  },
  solving: {
    tag: "03 / Problem Solving",
    title: "Lemon Logic Path",
    copy: "Break messy problems into pieces, test a route, then rebuild the system with clearer logic. The lemon tower guards the path from vague thinking.",
    proof: ["Debugging", "Systems thinking", "Decision flow"],
    target: new THREE.Vector3(-2.5, -0.45, -2.65),
    focusRotation: 2.42
  },
  quality: {
    tag: "04 / Code Quality",
    title: "Clean Spell Stack",
    copy: "Readable structure matters. The floating code tiles show modular thinking, careful naming, maintainable details, and fewer mystery bugs.",
    proof: ["Maintainability", "Scoped modules", "Performance care"],
    target: new THREE.Vector3(2.75, -0.35, -2.5),
    focusRotation: -2.34
  },
  communication: {
    tag: "05 / Technical Communication",
    title: "Clarity Campfire",
    copy: "Strong work becomes stronger when it can be explained. Speech cards, signs, and warm light turn technical thinking into clear language.",
    proof: ["Clear writing", "Stakeholder language", "Technical framing"],
    target: new THREE.Vector3(0, 2.35, -2.85),
    focusRotation: Math.PI
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
  white: 0xfff7dc,
  jakeYellow: 0xf2b23b,
  jakeShadow: 0xd48618,
  candyPink: 0xf08fb0,
  candyBlue: 0x7fb8d9,
  lemon: 0xf4df4c
};

let activeKey = normalizeHash() || document.body.dataset.initialValue || "impact";

if (canvas) {
  initLab();
}

function initLab() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isVisible = true;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.2 : 1.75));
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

  const candyWorld = createCandyWorld();
  rig.add(candyWorld.group);

  const processLoop = createProcessLoop();
  rig.add(processLoop.group);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, dragging: false, lastX: 0, lastY: 0 };
  let focusRotation = valueData[activeKey].focusRotation || 0;
  let dragRotation = 0;

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
      dragRotation += (event.clientX - pointer.lastX) * 0.006;
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
  const visibilityObserver = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
  });
  visibilityObserver.observe(canvas);
  resize();
  setActive(activeKey, false);

  renderer.setAnimationLoop((elapsedMs) => {
    if (!isVisible) {
      return;
    }

    const time = elapsedMs * 0.001;
    const motionScale = reducedMotion ? 0.32 : 1;
    pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx, reducedMotion ? 0.035 : 0.06);
    pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty, reducedMotion ? 0.035 : 0.06);

    dragRotation = THREE.MathUtils.lerp(dragRotation, 0, pointer.dragging ? 0.004 : 0.025);
    const desiredRotation = focusRotation + dragRotation + pointer.x * 0.14;
    rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, desiredRotation, reducedMotion ? 0.035 : 0.06);
    rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, -pointer.y * 0.05, 0.04);

    jake.update(time * motionScale, activeKey, rig.rotation.y);
    updateValueGroups(valueGroups, time * motionScale);
    updateConstellations(constellations, time * motionScale);
    updateCandyWorld(candyWorld, time * motionScale, activeKey);
    updateProcessLoop(processLoop, time * motionScale, activeKey);

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
    proofElements.forEach((element, index) => {
      if (element) {
        element.textContent = data.proof[index] || "";
      }
    });

    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === key);
    });

    Object.entries(valueGroups).forEach(([groupKey, group]) => {
      group.userData.active = groupKey === key;
    });

    focusRotation = data.focusRotation || 0;
    dragRotation = 0;

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
  const faceRig = new THREE.Group();
  faceRig.position.set(0, 0, 0.02);
  group.add(faceRig);

  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 64, 48),
    material(colors.jakeYellow, { roughness: 0.5, metalness: 0.02 })
  );
  outer.scale.set(0.74, 1.18, 0.48);
  outer.castShadow = true;
  outer.receiveShadow = true;
  group.add(outer);

  const sideShade = new THREE.Mesh(
    new THREE.SphereGeometry(1.42, 48, 32),
    material(colors.jakeShadow, { roughness: 0.58, metalness: 0.02, transparent: true, opacity: 0.34 })
  );
  sideShade.scale.set(0.68, 1.08, 0.32);
  sideShade.position.set(0.18, -0.02, -0.08);
  sideShade.castShadow = true;
  group.add(sideShade);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 64, 40),
    material(0xffc568, { roughness: 0.55, metalness: 0.02 })
  );
  face.position.z = 0.25;
  face.scale.set(0.7, 1.02, 0.24);
  face.castShadow = true;
  faceRig.add(face);

  const faceRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.026, 16, 96),
    material(0xc97518, { roughness: 0.48, metalness: 0.03, transparent: true, opacity: 0.48 })
  );
  faceRim.position.set(0, -0.05, 0.76);
  faceRim.scale.set(0.78, 1.12, 0.18);
  faceRig.add(faceRim);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 40, 32),
    material(0xffd587, { roughness: 0.56, metalness: 0.02 })
  );
  belly.position.set(0, -0.56, 0.7);
  belly.scale.set(1.05, 0.78, 0.22);
  belly.castShadow = true;
  faceRig.add(belly);

  const ears = [
    { x: -0.58, rotation: 0.32 },
    { x: 0.58, rotation: -0.32 }
  ].map((item) => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.68, 4),
      material(colors.jakeShadow, { roughness: 0.56 })
    );
    ear.position.set(item.x, 1.35, 0.06);
    ear.rotation.set(0.08, item.rotation, Math.sign(-item.x) * 0.35);
    ear.castShadow = true;
    group.add(ear);

    const innerEar = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.38, 4),
      material(0xffd587, { roughness: 0.55 })
    );
    innerEar.position.set(item.x * 0.99, 1.32, 0.18);
    innerEar.rotation.copy(ear.rotation);
    innerEar.scale.set(0.78, 0.82, 0.42);
    group.add(innerEar);
    return ear;
  });

  const eyeMaterial = material(0x050606, { roughness: 0.22, metalness: 0.04 });
  const eyes = [-0.43, 0.43].map((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 24), eyeMaterial);
    eye.position.set(x, -0.02, 0.76);
    eye.scale.set(1, 1, 0.32);
    faceRig.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), material(colors.white, { roughness: 0.2 }));
    shine.position.set(x - 0.035, 0.025, 0.795);
    shine.scale.set(1, 1, 0.4);
    faceRig.add(shine);
    return eye;
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.025, 10, 40, Math.PI),
    eyeMaterial
  );
  smile.position.set(0, -0.34, 0.78);
  smile.rotation.set(0, 0, Math.PI);
  smile.scale.set(1, 0.72, 0.35);
  faceRig.add(smile);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 18, 18),
    eyeMaterial
  );
  nose.position.set(0, -0.18, 0.81);
  nose.scale.set(1.2, 0.82, 0.42);
  faceRig.add(nose);

  [-1, 1].forEach((side) => {
    const cheek = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 18),
      material(0xffc262, { roughness: 0.62 })
    );
    cheek.position.set(side * 0.2, -0.22, 0.77);
    cheek.scale.set(1, 0.74, 0.25);
    faceRig.add(cheek);
  });

  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.018, 0.22, 10),
      material(colors.coal, { roughness: 0.35 })
    );
    brow.position.set(side * 0.43, 0.16, 0.79);
    brow.rotation.set(Math.PI / 2, 0, side * 0.35);
    faceRig.add(brow);

    for (let index = 0; index < 3; index += 1) {
      const whisker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.013, 0.62, 12),
        material(colors.coal, { roughness: 0.35 })
      );
      whisker.position.set(side * 0.52, -0.22 + index * 0.09, 0.72);
      whisker.rotation.set(Math.PI / 2, 0, side * (1.1 - index * 0.16));
      faceRig.add(whisker);
    }
  });

  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.045, 14, 72, Math.PI * 1.48),
    material(colors.jakeShadow, { roughness: 0.5 })
  );
  tail.position.set(0.93, -0.24, -0.08);
  tail.rotation.set(0.8, -0.2, -1.35);
  tail.castShadow = true;
  group.add(tail);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.07, 1.55, 18),
      material(colors.jakeYellow, { roughness: 0.56 })
    );
    arm.position.set(side * 0.92, -0.32, 0.2);
    arm.rotation.set(0.42, 0.12 * side, side * 0.84);
    arm.castShadow = true;
    group.add(arm);

    const paw = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 18, 18),
      material(colors.jakeYellow, { roughness: 0.56 })
    );
    paw.position.set(side * 1.45, -0.88, 0.18);
    paw.scale.set(1.15, 0.75, 0.7);
    paw.castShadow = true;
    group.add(paw);
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.12, 0.12, 56),
    material(colors.cream, { roughness: 0.7, transparent: true, opacity: 0.54 })
  );
  base.position.y = -1.5;
  base.receiveShadow = true;
  group.add(base);

  return {
    group,
    update(time, activeKey, worldRotation = 0) {
      const lively = activeKey === "curiosity" ? 1.18 : 1;
      group.position.y = 0.15 + Math.sin(time * 1.4) * 0.08;
      group.rotation.z = Math.sin(time * 0.75) * 0.025;
      const faceTurn = THREE.MathUtils.clamp(-worldRotation * 0.62, -0.82, 0.82);
      faceRig.rotation.y = THREE.MathUtils.lerp(faceRig.rotation.y, faceTurn, 0.08);
      faceRig.rotation.x = THREE.MathUtils.lerp(faceRig.rotation.x, Math.sin(time * 0.9) * 0.035, 0.06);
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

function createCandyWorld() {
  const group = new THREE.Group();
  const movers = [];

  const candyTrees = [
    [-5.1, -1.52, -0.8, colors.candyPink],
    [-4.5, -1.52, 2.9, colors.candyBlue],
    [4.85, -1.52, -0.7, colors.candyPink],
    [4.4, -1.52, 2.6, colors.lemon],
    [0.7, -1.52, 3.9, colors.candyBlue]
  ];

  candyTrees.forEach(([x, y, z, color], index) => {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.82, 12),
      material(colors.warm, { roughness: 0.48 })
    );
    trunk.position.y = 0.34;
    trunk.castShadow = true;
    tree.add(trunk);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      material(color, { roughness: 0.44, metalness: 0.02 })
    );
    top.position.y = 0.82;
    top.scale.set(1, 0.86, 1);
    top.castShadow = true;
    tree.add(top);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.018, 8, 40),
      material(colors.cream, { roughness: 0.52 })
    );
    ring.position.y = 0.82;
    ring.rotation.x = Math.PI / 2;
    tree.add(ring);

    movers.push({ item: tree, kind: "tree", phase: index * 0.7 });
    group.add(tree);
  });

  const lemonTower = new THREE.Group();
  lemonTower.position.set(-4.35, -1.48, -2.55);
  const lemonHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 32, 24),
    material(colors.lemon, { roughness: 0.5, metalness: 0.02 })
  );
  lemonHead.scale.set(0.78, 1.22, 0.78);
  lemonHead.position.y = 1.15;
  lemonHead.castShadow = true;
  lemonTower.add(lemonHead);

  const lemonBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.34, 1.1, 6),
    material(colors.lemon, { roughness: 0.54 })
  );
  lemonBody.position.y = 0.48;
  lemonBody.castShadow = true;
  lemonTower.add(lemonBody);

  [-0.12, 0.12].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), material(colors.coal, { roughness: 0.28 }));
    eye.position.set(x, 1.22, 0.34);
    lemonTower.add(eye);
  });

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.32, 5),
    material(colors.warm, { roughness: 0.38 })
  );
  crown.position.y = 1.73;
  crown.castShadow = true;
  lemonTower.add(crown);
  movers.push({ item: lemonTower, kind: "tower", phase: 0.4 });
  group.add(lemonTower);

  const portal = new THREE.Group();
  portal.position.set(4.2, -0.35, -2.7);
  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.05, 18, 80),
    material(colors.candyBlue, { emissive: colors.candyBlue, emissiveIntensity: 0.1, roughness: 0.38 })
  );
  portal.add(portalRing);
  const portalDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.63, 48),
    material(0xd9fff3, { transparent: true, opacity: 0.34, roughness: 0.24 })
  );
  portal.add(portalDisc);
  movers.push({ item: portal, kind: "portal", phase: 1.2 });
  group.add(portal);

  for (let index = 0; index < 10; index += 1) {
    const charm = new THREE.Mesh(
      index % 2
        ? new THREE.OctahedronGeometry(0.09, 0)
        : new THREE.SphereGeometry(0.085, 14, 14),
      material(index % 3 === 0 ? colors.candyPink : index % 3 === 1 ? colors.lemon : colors.candyBlue, {
        emissive: index % 3 === 0 ? colors.candyPink : index % 3 === 1 ? colors.lemon : colors.candyBlue,
        emissiveIntensity: 0.06,
        roughness: 0.46
      })
    );
    charm.position.set(Math.cos(index) * 3.8, -0.45 + Math.sin(index * 1.7) * 0.5, Math.sin(index) * 3.2);
    charm.castShadow = true;
    movers.push({ item: charm, kind: "charm", phase: index * 0.37, radius: 3.8 + (index % 3) * 0.32 });
    group.add(charm);
  }

  return { group, movers };
}

function updateCandyWorld(world, time, activeKey) {
  world.movers.forEach((entry, index) => {
    if (entry.kind === "tree") {
      entry.item.rotation.z = Math.sin(time * 1.2 + entry.phase) * 0.035;
      entry.item.scale.y = 1 + Math.sin(time * 1.5 + entry.phase) * 0.025;
    }

    if (entry.kind === "tower") {
      entry.item.rotation.y = Math.sin(time * 0.8) * 0.16;
      entry.item.position.y = -1.48 + Math.sin(time * 1.1 + entry.phase) * 0.035;
    }

    if (entry.kind === "portal") {
      entry.item.rotation.z = time * 0.28;
      entry.item.scale.setScalar(activeKey === "curiosity" ? 1.14 : 1);
    }

    if (entry.kind === "charm") {
      const speed = activeKey === "curiosity" ? 0.55 : 0.32;
      const angle = time * speed + entry.phase + index * 0.15;
      entry.item.position.x = Math.cos(angle) * entry.radius;
      entry.item.position.z = Math.sin(angle) * (entry.radius * 0.74);
      entry.item.position.y = -0.18 + Math.sin(time * 1.7 + entry.phase) * 0.42;
      entry.item.rotation.x += 0.012;
      entry.item.rotation.y += 0.018;
    }
  });
}

function createProcessLoop() {
  const group = new THREE.Group();
  const steps = [
    { label: "ask", color: colors.candyBlue, angle: Math.PI * 0.16 },
    { label: "build", color: colors.jakeYellow, angle: Math.PI * 0.66 },
    { label: "test", color: colors.lemon, angle: Math.PI * 1.16 },
    { label: "ship", color: colors.candyPink, angle: Math.PI * 1.66 }
  ];
  const items = [];

  steps.forEach((step, index) => {
    const station = new THREE.Group();
    const x = Math.cos(step.angle) * 2.18;
    const z = Math.sin(step.angle) * 1.78;
    station.position.set(x, -1.26, z);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.36, 0.12, 6),
      material(step.color, { roughness: 0.52, metalness: 0.03 })
    );
    pad.castShadow = true;
    pad.receiveShadow = true;
    station.add(pad);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.56, 10),
      material(colors.coal, { roughness: 0.48 })
    );
    mast.position.y = 0.31;
    station.add(mast);

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.3, 0.05),
      material(colors.surface, { roughness: 0.58 })
    );
    plaque.position.y = 0.68;
    plaque.rotation.y = -step.angle + Math.PI / 2;
    plaque.castShadow = true;
    station.add(plaque);

    const label = makeTextSprite(step.label, 0.28, colors.coal);
    label.position.y = 0.7;
    label.position.z = 0.05;
    label.rotation.y = plaque.rotation.y;
    station.add(label);

    items.push({ station, pad, plaque, phase: index * 0.62, label: step.label });
    group.add(station);
  });

  const loop = new THREE.Mesh(
    new THREE.TorusGeometry(2.03, 0.015, 8, 160),
    material(colors.moss, { transparent: true, opacity: 0.32, roughness: 0.44 })
  );
  loop.rotation.x = Math.PI / 2;
  loop.position.y = -1.23;
  loop.scale.z = 0.82;
  group.add(loop);

  return { group, items, loop };
}

function updateProcessLoop(loopData, time, activeKey) {
  const speed = activeKey === "quality" || activeKey === "solving" ? 1.25 : 1;
  loopData.loop.rotation.z = time * 0.16 * speed;

  loopData.items.forEach((item) => {
    item.station.position.y = -1.26 + Math.sin(time * 1.5 + item.phase) * 0.035;
    item.plaque.scale.x = THREE.MathUtils.lerp(
      item.plaque.scale.x,
      activeKey === "communication" ? 1.12 : 1,
      0.06
    );
    item.pad.rotation.y += 0.012 * speed;
  });
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
