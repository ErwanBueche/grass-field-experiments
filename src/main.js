import * as THREE from 'three';
import GrassField from './grass-field.js';

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7EC8E3); // Sky blue

// --- Camera — fixed top-down view of 50x50 field ---
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 40, 35);
camera.lookAt(0, 0, 0);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- Lighting (Genshin/Zelda inspired — soft, warm) ---

// Warm sun
const sunLight = new THREE.DirectionalLight(0xFFEECC, 1.5);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Fill light (cool)
const fillLight = new THREE.DirectionalLight(0x88CCFF, 0.4);
fillLight.position.set(-20, 20, -30);
scene.add(fillLight);

// Ambient
const ambientLight = new THREE.AmbientLight(0x7799BB, 0.4);
scene.add(ambientLight);

// Hemisphere for natural feel
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.6);
scene.add(hemiLight);

// --- Ground (dirt/soil beneath the grass) ---
const groundGeo = new THREE.CircleGeometry(30, 48);
groundGeo.rotateX(-Math.PI / 2);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x4a7c3f,
  roughness: 1.0,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

// --- Grass Field ---
const grassField = new GrassField({
  count: 150000,
  areaSize: 50,
  bladeHeight: 0.9,
  windStrength: 0.5,
});
scene.add(grassField.mesh);

// --- Fog for depth (like Zelda) ---
scene.fog = new THREE.Fog(0x7EC8E3, 40, 80);

// --- Animation Loop ---
const clock = new THREE.Clock();
let fpsCount = 0;
let fpsTime = 0;
const fpsEl = document.querySelector('#info .fps');

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  grassField.updateTime(elapsed);
  renderer.render(scene, camera);

  // FPS
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
