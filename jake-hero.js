import * as THREE from "https://esm.sh/three@0.160.0";
import { STLLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader.js";

const canvas = document.getElementById("jake-model-canvas");
const stage = document.querySelector(".jake-stage");

if (canvas && stage) {
  initJakeHero();
}

function initJakeHero() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.35, 7.6);

  const rig = new THREE.Group();
  rig.rotation.set(-0.12, -0.22, 0.02);
  scene.add(rig);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x46f7d7, 2.2);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.HemisphereLight(0xb74b4b, 0x050505, 1.7);
  scene.add(fillLight);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xdedede,
    roughness: 0.46,
    metalness: 0.16,
    clearcoat: 0.4,
    clearcoatRoughness: 0.28,
    emissive: 0x230707,
    emissiveIntensity: 0.18
  });

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x46f7d7,
    transparent: true,
    opacity: 0.13
  });

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let model = null;
  let edges = null;
  let isVisible = true;

  new STLLoader().load(
    "models/Jake_floating_web.stl",
    (geometry) => {
      geometry.computeVertexNormals();
      geometry.center();
      geometry.computeBoundingBox();

      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const scale = 3.35 / Math.max(size.x, size.y, size.z);
      geometry.scale(scale, scale, scale);

      model = new THREE.Mesh(geometry, material);
      model.rotation.set(-1.42, 0.16, 0.08);
      model.position.set(0.42, -0.12, 0);
      rig.add(model);

      edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 22), edgeMaterial);
      edges.rotation.copy(model.rotation);
      edges.position.copy(model.position);
      rig.add(edges);

      stage.classList.add("is-ready");
    },
    undefined,
    () => {
      const loading = stage.querySelector(".jake-loading");
      if (loading) {
        loading.textContent = "model unavailable";
      }
    }
  );

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  stage.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
  });
  observer.observe(stage);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  renderer.setAnimationLoop((elapsedMs) => {
    if (!isVisible) {
      return;
    }

    const time = elapsedMs * 0.001;
    const speed = reducedMotion ? 0.22 : 1;

    pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.targetX, 0.055);
    pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.targetY, 0.055);

    rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, -0.22 + pointer.x * 0.22, 0.04);
    rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, -0.12 - pointer.y * 0.12, 0.04);
    rig.position.y = Math.sin(time * 1.35 * speed) * 0.12;

    if (model) {
      model.rotation.z = 0.08 + Math.sin(time * 0.78 * speed) * 0.045;
      model.rotation.y = 0.16 + Math.sin(time * 0.42 * speed) * 0.08;
    }

    if (edges && model) {
      edges.rotation.copy(model.rotation);
      edges.position.copy(model.position);
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.42, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.35 - pointer.y * 0.18, 0.04);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  function resize() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}
