import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GrassField from './grass-field.js';

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 8, 15);
camera.lookAt(0, 0, 0);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 3;
controls.maxDistance = 80;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.0);
directionalLight.position.set(20, 30, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4);
scene.add(hemisphereLight);

// --- Ground ---
const groundGeometry = new THREE.CircleGeometry(35, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d5a27,
  roughness: 0.9,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// --- GrassField ---
const grassField = new GrassField({
  count: 100000,
  areaSize: 50,
  bladeHeight: 0.8,
  windStrength: 0.4,
  windFrequency: 0.6,
});
scene.add(grassField.mesh);

// --- Animation Loop ---
const clock = new THREE.Clock();
let fpsCounter = 0;
let fpsTime = 0;
const fpsElement = document.querySelector('#info .fps');

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  grassField.updateTime(elapsed);
  controls.update();
  renderer.render(scene, camera);

  // FPS counter — update once per second
  fpsCounter++;
  fpsTime += delta;
  if (fpsTime >= 1.0) {
    if (fpsElement) {
      fpsElement.textContent = `${fpsCounter} FPS`;
    }
    fpsCounter = 0;
    fpsTime = 0;
  }

  requestAnimationFrame(animate);
}

animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
