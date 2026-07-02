import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.28, 6.2);

  const rig = new THREE.Group();
  rig.rotation.set(-0.08, -0.1, 0.02);
  scene.add(rig);

  const dragPivot = new THREE.Group();
  rig.add(dragPivot);

  const keyLight = new THREE.DirectionalLight(0xfff4df, 4.4);
  keyLight.position.set(3.2, 5.4, 4.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.8;
  keyLight.shadow.camera.far = 16;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  scene.add(keyLight);

  const warmSideLight = new THREE.DirectionalLight(0xff9b26, 2.6);
  warmSideLight.position.set(-4.2, 2.3, 3.8);
  scene.add(warmSideLight);

  const rimLight = new THREE.DirectionalLight(0x2ff3b0, 0.65);
  rimLight.position.set(-3.5, 2.2, -4);
  scene.add(rimLight);

  const fillLight = new THREE.HemisphereLight(0xffdfad, 0x2a1202, 2.6);
  scene.add(fillLight);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 3.4),
    new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: 0.28,
      transparent: true
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0.05, -1.48, 0.15);
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const hover = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const drag = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startYaw: 0,
    startPitch: 0,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0
  };
  const maxPitch = THREE.MathUtils.degToRad(30);
  const maxYaw = THREE.MathUtils.degToRad(45);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let model = null;
  let isVisible = true;

  new GLTFLoader().load(
    "models/cute-cartoon-character.glb?v=cute-character-13",
    (gltf) => {
      const asset = gltf.scene;
      asset.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        if (child.name === "Plane") {
          child.visible = false;
          return;
        }

        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      asset.updateWorldMatrix(true, true);
      const box = getVisibleModelBox(asset);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      asset.position.sub(center);
      model = new THREE.Group();
      model.add(asset);
      model.scale.setScalar(2.68 / Math.max(size.x, size.y, size.z));
      model.position.set(0, 0.02, 0);
      model.rotation.set(0, -0.16, 0.04);
      dragPivot.add(model);

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

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.startYaw = drag.targetYaw;
    drag.startPitch = drag.targetPitch;
    stage.classList.add("is-dragging");
    stage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    hover.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    hover.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    if (drag.active && event.pointerId === drag.pointerId) {
      const yawDelta = ((event.clientX - drag.startX) / rect.width) * Math.PI * 1.25;
      const pitchDelta = -((event.clientY - drag.startY) / rect.height) * Math.PI * 0.8;

      drag.targetYaw = THREE.MathUtils.clamp(drag.startYaw + yawDelta, -maxYaw, maxYaw);
      drag.targetPitch = THREE.MathUtils.clamp(drag.startPitch + pitchDelta, -maxPitch, maxPitch);
      event.preventDefault();
    }
  });

  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  stage.addEventListener("pointerleave", () => {
    hover.targetX = 0;
    hover.targetY = 0;
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
    const hoverStrength = drag.active ? 0 : 1;

    hover.x = THREE.MathUtils.lerp(hover.x, hover.targetX, 0.055);
    hover.y = THREE.MathUtils.lerp(hover.y, hover.targetY, 0.055);
    drag.yaw = THREE.MathUtils.lerp(drag.yaw, drag.targetYaw, 0.14);
    drag.pitch = THREE.MathUtils.lerp(drag.pitch, drag.targetPitch, 0.14);

    dragPivot.rotation.y = drag.yaw;
    dragPivot.rotation.x = drag.pitch;

    rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, -0.1 + hover.x * 0.13 * hoverStrength, 0.04);
    rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, -0.08 - hover.y * 0.08 * hoverStrength, 0.04);
    rig.position.y = Math.sin(time * 1.28 * speed) * 0.1;

    if (model) {
      model.rotation.z = 0.07 + Math.sin(time * 0.78 * speed) * 0.032;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, hover.x * 0.34 * hoverStrength, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.3 - hover.y * 0.13 * hoverStrength, 0.04);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  function finishDrag(event) {
    if (!drag.active || event.pointerId !== drag.pointerId) {
      return;
    }

    drag.active = false;
    drag.pointerId = null;
    stage.classList.remove("is-dragging");

    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function getVisibleModelBox(root) {
  const box = new THREE.Box3();
  const meshBox = new THREE.Box3();

  root.traverse((child) => {
    if (!child.isMesh || !child.visible) {
      return;
    }

    if (!child.geometry.boundingBox) {
      child.geometry.computeBoundingBox();
    }

    meshBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
    box.union(meshBox);
  });

  return box;
}
