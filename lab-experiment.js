import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("experiment-canvas");
const mode = document.body.dataset.experiment || "terrain";
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

const colors = {
  cream: 0xf2e6c0,
  avocado: 0xafa34a,
  moss: 0x6f7132,
  coal: 0x152822,
  ember: 0xd68f4a
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});

renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x10231d, 0.032);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(0, 5.4, 13.5);

const rig = new THREE.Group();
scene.add(rig);

scene.add(new THREE.HemisphereLight(0xf2e6c0, 0x091411, 2.2));

const keyLight = new THREE.DirectionalLight(0xfff2cc, 3.8);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xafa34a, 1.4);
rimLight.position.set(-5, 4, -6);
scene.add(rimLight);

let updateScene = () => {};

if (mode === "command") {
  updateScene = buildCommandScene();
} else if (mode === "robot") {
  updateScene = buildRobotScene();
} else {
  updateScene = buildTerrainScene();
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
});

canvas.addEventListener("pointerleave", () => {
  pointer.tx = 0;
  pointer.ty = 0;
});

window.addEventListener("resize", resize);
resize();
renderer.setAnimationLoop(animate);

function resize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate(elapsedMs) {
  const time = elapsedMs * 0.001;
  pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.tx, 0.06);
  pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.ty, 0.06);
  rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, pointer.x * 0.16, 0.04);
  rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, -pointer.y * 0.06, 0.04);

  updateScene(time);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.4, 0.04);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5.4 - pointer.y * 0.8, 0.04);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.48,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function addFloor(parent, radius = 17) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 96),
    new THREE.MeshStandardMaterial({
      color: colors.coal,
      roughness: 0.78,
      metalness: 0.04,
      transparent: true,
      opacity: 0.62
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  floor.receiveShadow = true;
  parent.add(floor);
  return floor;
}

function makeTextSprite(text, size = 0.42) {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = 256;
  canvas2d.height = 128;
  const c = canvas2d.getContext("2d");
  c.fillStyle = "rgba(242,230,192,0.92)";
  c.font = "800 42px Inter, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 128, 64);
  const texture = new THREE.CanvasTexture(canvas2d);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(size * 2, size, 1);
  return sprite;
}

function buildCommandScene() {
  const group = new THREE.Group();
  rig.add(group);
  addFloor(group, 16);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.18, 7),
    createMaterial(0x1d3029, { roughness: 0.68, metalness: 0.12 })
  );
  board.position.y = -1.2;
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  const grid = new THREE.GridHelper(11, 18, colors.avocado, 0x385044);
  grid.position.y = -1.08;
  grid.scale.z = 0.64;
  group.add(grid);

  const nodeData = [
    { label: "CORE", pos: [-4.2, -0.55, -1.8], color: colors.cream },
    { label: "A1", pos: [-1.8, -0.35, 1.7], color: colors.avocado },
    { label: "B2", pos: [1.6, -0.4, -1.4], color: colors.moss },
    { label: "SIM", pos: [0.4, -0.28, 2.7], color: colors.avocado },
    { label: "OBJ", pos: [4.2, -0.5, 0.8], color: colors.cream }
  ];

  const nodes = nodeData.map((item) => {
    const node = new THREE.Group();
    node.position.set(...item.pos);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.68, 0.28, 40),
      createMaterial(item.color, { metalness: 0.18, emissive: item.color, emissiveIntensity: 0.06 })
    );
    base.castShadow = true;
    node.add(base);

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.9, 16),
      createMaterial(colors.coal, { roughness: 0.4 })
    );
    antenna.position.y = 0.56;
    node.add(antenna);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.025, 10, 72),
      createMaterial(colors.cream, { emissive: colors.cream, emissiveIntensity: 0.18, transparent: true, opacity: 0.58 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    node.add(ring);

    const label = makeTextSprite(item.label, 0.5);
    label.position.y = 1.15;
    node.add(label);
    group.add(node);
    return { node, ring, base };
  });

  const paths = [];
  for (let index = 0; index < nodeData.length; index += 1) {
    const start = new THREE.Vector3(...nodeData[index].pos);
    const end = new THREE.Vector3(...nodeData[(index + 1) % nodeData.length].pos);
    const curve = new THREE.CatmullRomCurve3([
      start,
      start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.35 + index * 0.08, 0)),
      end
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, 0.035, 8, false),
      createMaterial(index % 2 ? colors.avocado : colors.cream, {
        emissive: index % 2 ? colors.avocado : colors.cream,
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.68
      })
    );
    group.add(tube);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 20),
      createMaterial(colors.cream, { emissive: colors.cream, emissiveIntensity: 0.8 })
    );
    group.add(pulse);
    paths.push({ curve, pulse, tube });
  }

  return (time) => {
    group.rotation.y = Math.sin(time * 0.22) * 0.08;
    nodes.forEach(({ node, ring }, index) => {
      node.position.y = nodeData[index].pos[1] + Math.sin(time * 1.4 + index) * 0.08;
      ring.rotation.z = time * (0.8 + index * 0.08);
      ring.scale.setScalar(1 + Math.sin(time * 2 + index) * 0.06);
    });
    paths.forEach(({ curve, pulse }, index) => {
      const point = curve.getPoint((time * 0.18 + index * 0.17) % 1);
      pulse.position.copy(point);
    });
  };
}

function buildTerrainScene() {
  const group = new THREE.Group();
  rig.add(group);

  const geometry = new THREE.PlaneGeometry(18, 12, 96, 64);
  geometry.rotateX(-Math.PI / 2);
  const base = new Float32Array(geometry.attributes.position.array);

  const material = new THREE.MeshStandardMaterial({
    color: colors.avocado,
    emissive: colors.moss,
    emissiveIntensity: 0.12,
    wireframe: true,
    transparent: true,
    opacity: 0.86,
    roughness: 0.5,
    metalness: 0.08
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.y = -1.7;
  terrain.castShadow = false;
  terrain.receiveShadow = true;
  group.add(terrain);

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 0.08),
    createMaterial(colors.cream, { emissive: colors.cream, emissiveIntensity: 0.8, transparent: true, opacity: 0.72 })
  );
  scan.rotation.x = -Math.PI / 2;
  scan.position.y = -0.42;
  group.add(scan);

  const markers = [];
  for (let i = 0; i < 18; i += 1) {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 0.5, 12),
      createMaterial(i % 2 ? colors.cream : colors.moss, {
        emissive: i % 2 ? colors.cream : colors.moss,
        emissiveIntensity: 0.18
      })
    );
    marker.position.set((Math.random() - 0.5) * 14, -1.1, (Math.random() - 0.5) * 8);
    marker.castShadow = true;
    group.add(marker);
    markers.push(marker);
  }

  return (time) => {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const distance = Math.sqrt((x / 9 - pointer.x * 0.3) ** 2 + (z / 6 + pointer.y * 0.3) ** 2);
      positions[i + 1] =
        Math.sin(x * 0.85 + time * 1.2) * 0.34 +
        Math.cos(z * 1.1 + time * 0.9) * 0.28 +
        Math.cos(distance * 8.5 - time * 3.2) * 0.26;
    }
    geometry.attributes.position.needsUpdate = true;
    terrain.rotation.z = Math.sin(time * 0.18) * 0.035;
    scan.position.z = ((time * 2.2) % 12) - 6;
    markers.forEach((marker, index) => {
      marker.position.y = -0.98 + Math.sin(time * 1.6 + index) * 0.28;
      marker.rotation.y += 0.01 + index * 0.0008;
    });
  };
}

function buildRobotScene() {
  const group = new THREE.Group();
  rig.add(group);
  addFloor(group, 15);

  const volcano = new THREE.Group();
  volcano.position.set(-3.5, -1.5, 0);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 3.8, 8),
    createMaterial(0x2a1b12, { roughness: 0.82 })
  );
  cone.castShadow = true;
  volcano.add(cone);
  const lava = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 2.5, 8),
    createMaterial(colors.ember, { emissive: colors.ember, emissiveIntensity: 0.5, transparent: true, opacity: 0.86 })
  );
  lava.position.y = 0.25;
  volcano.add(lava);
  group.add(volcano);

  const robot = new THREE.Group();
  robot.position.set(2.2, -0.35, 0);
  group.add(robot);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 2.2, 1.1),
    createMaterial(colors.avocado, { metalness: 0.18, roughness: 0.38 })
  );
  body.castShadow = true;
  robot.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.9, 0.95),
    createMaterial(colors.cream, { metalness: 0.12, roughness: 0.32 })
  );
  head.position.y = 1.65;
  head.castShadow = true;
  robot.add(head);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.22, 0.04),
    createMaterial(colors.coal, { emissive: colors.coal, emissiveIntensity: 0.18 })
  );
  visor.position.set(0, 1.68, 0.5);
  robot.add(visor);

  const joints = [];
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 1.15, 0.58, 0);
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.25, 16),
      createMaterial(colors.cream, { metalness: 0.2 })
    );
    upper.rotation.z = Math.PI / 2.8 * side;
    upper.castShadow = true;
    arm.add(upper);
    const claw = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.055, 10, 24, Math.PI * 1.35),
      createMaterial(colors.moss, { metalness: 0.2, emissive: colors.moss, emissiveIntensity: 0.1 })
    );
    claw.position.set(side * 0.74, -0.54, 0);
    claw.rotation.z = side * 0.6;
    arm.add(claw);
    robot.add(arm);
    joints.push(arm);
  });

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.025, 12, 96),
    createMaterial(colors.cream, { emissive: colors.cream, emissiveIntensity: 0.28, transparent: true, opacity: 0.58 })
  );
  halo.rotation.x = Math.PI / 2;
  robot.add(halo);

  const smoke = [];
  for (let i = 0; i < 26; i += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 12, 12),
      createMaterial(colors.cream, { transparent: true, opacity: 0.28 })
    );
    puff.position.set(-3.5 + (Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 3, (Math.random() - 0.5) * 0.9);
    group.add(puff);
    smoke.push(puff);
  }

  return (time) => {
    volcano.rotation.y = Math.sin(time * 0.2) * 0.08;
    lava.scale.y = 1 + Math.sin(time * 2.2) * 0.12;
    robot.rotation.y = pointer.x * 0.34 + Math.sin(time * 0.35) * 0.16;
    robot.position.y = -0.32 + Math.sin(time * 1.2) * 0.1;
    head.rotation.y = pointer.x * 0.28;
    joints.forEach((joint, index) => {
      joint.rotation.z = Math.sin(time * 1.4 + index) * 0.24;
      joint.rotation.x = Math.cos(time * 1.1 + index) * 0.16;
    });
    halo.rotation.z = time * 0.8;
    smoke.forEach((puff, index) => {
      puff.position.y += 0.012 + index * 0.0003;
      puff.position.x += Math.sin(time + index) * 0.002;
      puff.material.opacity = 0.24 + Math.sin(time * 1.3 + index) * 0.08;
      if (puff.position.y > 4.2) {
        puff.position.y = 0.5;
      }
    });
  };
}
