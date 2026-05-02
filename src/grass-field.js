import * as THREE from 'three';

const vertexShader = `
  attribute vec3 instancePosition;
  attribute float instanceRandomOffset;
  attribute float instanceHeightScale;
  attribute vec3 instanceColor;

  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindFrequency;

  varying vec3 vColor;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    // Scale blade height
    vec3 pos = position;
    pos.y *= instanceHeightScale;

    // Wind displacement
    float windX = sin(uTime * 1.5 + pos.x * uWindFrequency + instanceRandomOffset * 6.2832) * uWindStrength * pos.y;
    float windZ = cos(uTime * 1.2 + pos.z * uWindFrequency * 0.7 + instanceRandomOffset * 6.2832) * uWindStrength * 0.6 * pos.y;

    vec3 windOffset = vec3(windX, 0.0, windZ);
    vec3 displacedPos = pos + windOffset;

    // Compute approximate normal rotation due to wind bending
    // The blade normal is (0, 0, 1) originally. Wind bends it.
    // Approximate tangent direction from wind gradient
    float dWindXdY = sin(uTime * 1.5 + pos.x * uWindFrequency + instanceRandomOffset * 6.2832) * uWindStrength;
    float dWindZdY = cos(uTime * 1.2 + pos.z * uWindFrequency * 0.7 + instanceRandomOffset * 6.2832) * uWindStrength * 0.6;

    // Original normal (0, 0, 1), bent by wind gradient
    vec3 bentNormal = normalize(vec3(-dWindXdY, 0.0, 1.0 - dWindZdY));
    vNormal = normalize(normalMatrix * bentNormal);

    // Final position
    vec3 worldPos = instancePosition + displacedPos;
    vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vColor = instanceColor;
    vHeight = pos.y / instanceHeightScale; // normalized 0-1
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    // Tip coloring: darker base to lighter/yellower tip
    vec3 baseColor = mix(vColor * 0.6, vColor * 1.3, vHeight);

    // Simple lighting: ambient + directional
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float lighting = 0.3 + 0.7 * diff;

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
    this._createInstancedAttributes();
    this._createMaterial();
    this._createMesh();
  }

  _createBladeGeometry() {
    const baseWidth = 0.025;
    const topWidth = 0.005;
    const halfBase = baseWidth / 2;
    const halfTop = topWidth / 2;

    const positions = new Float32Array([
      -halfBase, 0.0, 0.0,  // 0: bottom-left
       halfBase, 0.0, 0.0,  // 1: bottom-right
       halfTop,  1.0, 0.0,  // 2: top-right
      -halfTop,  1.0, 0.0,  // 3: top-left
    ]);

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);

    const uvs = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ]);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);
  }

  _createInstancedAttributes() {
    const instancePositions = new Float32Array(this.count * 3);
    const instanceRandomOffsets = new Float32Array(this.count);
    const instanceHeightScales = new Float32Array(this.count);
    const instanceColors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      instancePositions[i3]     = (Math.random() - 0.5) * this.areaSize;
      instancePositions[i3 + 1] = 0.0;
      instancePositions[i3 + 2] = (Math.random() - 0.5) * this.areaSize;

      instanceRandomOffsets[i] = Math.random();

      instanceHeightScales[i] = 0.7 + Math.random() * 0.6; // [0.7, 1.3]

      const hue = 100 + Math.random() * 40;        // 100-140
      const sat = 0.4 + Math.random() * 0.3;       // 0.4-0.7
      const lum = 0.3 + Math.random() * 0.2;       // 0.3-0.5
      const [r, g, b] = hslToRgb(hue, sat, lum);
      instanceColors[i3]     = r;
      instanceColors[i3 + 1] = g;
      instanceColors[i3 + 2] = b;
    }

    this.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(instancePositions, 3));
    this.geometry.setAttribute('instanceRandomOffset', new THREE.InstancedBufferAttribute(instanceRandomOffsets, 1));
    this.geometry.setAttribute('instanceHeightScale', new THREE.InstancedBufferAttribute(instanceHeightScales, 1));
    this.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));
  }

  _createMaterial() {
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
  }

  _createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.instanceCount = this.count;
  }

  updateTime(time) {
    this.material.uniforms.uTime.value = time;
  }

  setWindStrength(value) {
    this.material.uniforms.uWindStrength.value = value;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default GrassField;
