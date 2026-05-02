import * as THREE from 'three';
import GrassField from './grass-field.js';

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// --- Camera — pure top-down ---
const camera = new THREE.OrthographicCamera(-35, 35, 35, -35, 0.1, 200);
camera.position.set(0, 100, 0.1);
camera.lookAt(0, 0, 0);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Square ground ---
const groundGeo = new THREE.PlaneGeometry(52, 52);
groundGeo.rotateX(-Math.PI / 2);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0x3a6b35,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.05;
scene.add(ground);

// --- Grass ---
const grassField = new GrassField({
  count: 5000,
  areaSize: 50,
  bladeHeight: 1.0,
});
scene.add(grassField.mesh);

// --- Lighting not needed with MeshBasicMaterial ---

// --- Animation ---
const clock = new THREE.Clock();
const fpsEl = document.querySelector('#info .fps');
let fpsCount = 0;
let fpsTime = 0;

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  grassField.updateTime(elapsed);
  renderer.render(scene, camera);

  fpsCount++;
  fpsTime += delta;
  if (fpsTime >= 1.0) {
    if (fpsEl) fpsEl.textContent = `${fpsCount} FPS`;
    fpsCount = 0;
    fpsTime = 0;
  }

  requestAnimationFrame(animate);
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 35;
  if (aspect > 1) {
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
  } else {
    camera.left = -viewSize;
    camera.right = viewSize;
    camera.top = viewSize / aspect;
    camera.bottom = -viewSize / aspect;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
