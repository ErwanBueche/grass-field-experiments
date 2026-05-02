import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindFrequency;

  attribute float instanceRandomOffset;
  attribute float instanceHeightScale;
  attribute vec3 instanceColor;

  varying vec3 vColor;
  varying float vHeight;

  void main() {
    // Scale blade height
    vec3 pos = position;
    pos.y *= instanceHeightScale;

    // Wind displacement — more bend at the tip (pos.y)
    float windX = sin(uTime * 1.5 + pos.x * uWindFrequency + instanceRandomOffset * 6.2832) * uWindStrength * pos.y;
    float windZ = cos(uTime * 1.2 + pos.z * uWindFrequency * 0.7 + instanceRandomOffset * 6.2832) * uWindStrength * 0.6 * pos.y;

    vec3 windOffset = vec3(windX, 0.0, windZ);
    vec3 displacedPos = pos + windOffset;

    // Use instanceMatrix for the base position + rotation, instanceMatrix includes rotation so wind applies in local space
    vec4 worldPos = instanceMatrix * vec4(displacedPos, 1.0);
    vec4 mvPosition = viewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;

    vColor = instanceColor;
    vHeight = pos.y / instanceHeightScale; // normalized 0-1
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vHeight;

  void main() {
    // Tip coloring: darker base to lighter/yellower tip
    vec3 darkBase = vColor * 0.5;
    vec3 lightTip = vec3(
      min(vColor.r * 1.5, 1.0),
      min(vColor.g * 1.3, 1.0),
      max(vColor.b * 0.8, 0.0)
    );
    vec3 baseColor = mix(darkBase, lightTip, pow(vHeight, 0.8));

    // Simple lighting: ambient + directional
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
    float diff = max(dot(normalize(vec3(0.0, 0.0, 1.0)), lightDir), 0.0);
    float lighting = 0.35 + 0.65 * diff;

    vec3 finalColor = baseColor * lighting;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function hslToRgb(h, s, l) {
  h /= 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 1 / 6) { r = c; g = x; b = 0; }
  else if (h < 2 / 6) { r = x; g = c; b = 0; }
  else if (h < 3 / 6) { r = 0; g = c; b = x; }
  else if (h < 4 / 6) { r = 0; g = x; b = c; }
  else if (h < 5 / 6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}

class GrassField {
  constructor(options = {}) {
    this.count = options.count ?? 50000;
    this.areaSize = options.areaSize ?? 50;
    this.bladeHeight = options.bladeHeight ?? 0.8;
    this.windStrength = options.windStrength ?? 0.3;
    this.windFrequency = options.windFrequency ?? 0.5;

    this._createBladeGeometry();
    this._createInstancedMesh();
  }

  _createBladeGeometry() {
    const baseWidth = 0.04;   // wider for better visibility
    const topWidth = 0.008;
    const height = 1.0;
    const halfBase = baseWidth / 2;
    const halfTop = topWidth / 2;

    const positions = new Float32Array([
      -halfBase, 0.0, 0.0,  // 0: bottom-left
       halfBase, 0.0, 0.0,  // 1: bottom-right
       halfTop,  height, 0.0, // 2: top-right
      -halfTop,  height, 0.0, // 3: top-left
    ]);

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    // We'll handle normals in the shader — simpler and less error-prone
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    this.geometry = geometry;
  }

  _createInstancedMesh() {
    const instancePositions = new Float32Array(this.count * 3);
    const instanceRandomOffsets = new Float32Array(this.count);
    const instanceHeightScales = new Float32Array(this.count);
    const instanceColors = new Float32Array(this.count * 3);

    const dummy = new THREE.Object3D();
    const meshes = [];

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * this.areaSize;
      const z = (Math.random() - 0.5) * this.areaSize;

      instancePositions[i3]     = x;
      instancePositions[i3 + 1] = 0.0;
      instancePositions[i3 + 2] = z;

      instanceRandomOffsets[i] = Math.random();
      instanceHeightScales[i] = 0.7 + Math.random() * 0.6; // [0.7, 1.3]

      const hue = 100 + Math.random() * 40;        // 100-140
      const sat = 0.4 + Math.random() * 0.3;       // 0.4-0.7
      const lum = 0.3 + Math.random() * 0.2;       // 0.3-0.5
      const [r, g, b] = hslToRgb(hue, sat, lum);
      instanceColors[i3]     = r;
      instanceColors[i3 + 1] = g;
      instanceColors[i3 + 2] = b;

      // Store per-instance data for matrix setup
      meshes.push({ x, z, randomYaw: Math.random() * Math.PI * 2 });
    }

    // Add custom instanced attributes to the geometry
    this.geometry.setAttribute('instanceRandomOffset', new THREE.InstancedBufferAttribute(instanceRandomOffsets, 1));
    this.geometry.setAttribute('instanceHeightScale', new THREE.InstancedBufferAttribute(instanceHeightScales, 1));
    this.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));

    // Create material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: this.windStrength },
        uWindFrequency: { value: this.windFrequency },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    // Create InstancedMesh — the canonical Three.js way
    const mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    mesh.frustumCulled = false;

    // Set instance matrices with position + random yaw rotation
    for (let i = 0; i < this.count; i++) {
      const m = meshes[i];
      dummy.position.set(m.x, 0, m.z);
      dummy.rotation.set(0, m.randomYaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    this.mesh = mesh;
  }

  updateTime(time) {
    this.material.uniforms.uTime.value = time;
  }

  setWindStrength(value) {
    this.material.uniforms.uWindStrength.value = value;
  }

  setWindFrequency(value) {
    this.material.uniforms.uWindFrequency.value = value;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default GrassField;
