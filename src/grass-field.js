import * as THREE from 'three';

const vertexShader = `
  attribute vec3 color;
  attribute vec2 windData;

  uniform float uTime;
  uniform float uWindStrength;

  varying vec3 vColor;
  varying float vHeight;

  void main() {
    float windPhase = windData.x;
    float heightScale = windData.y;

    vec3 pos = position;
    float h = pos.y / heightScale; // normalized 0-1

    // Wind displacement — more at the tip
    float windX = sin(uTime * 1.5 + pos.x * 0.5 + windPhase * 6.2832) * uWindStrength * h;
    float windZ = cos(uTime * 1.2 + pos.z * 0.35 + windPhase * 6.2832) * uWindStrength * 0.6 * h;
    pos.x += windX;
    pos.z += windZ;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    vColor = color;
    vHeight = h;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vHeight;

  void main() {
    // Genshin/Zelda stylized grass: darker base, vibrant tips
    vec3 darkBase = vColor * 0.5;
    vec3 lightTip = vec3(
      min(vColor.r * 1.5, 1.0),
      min(vColor.g * 1.3, 1.0),
      max(vColor.b * 0.8, 0.0)
    );
    vec3 baseColor = mix(darkBase, lightTip, pow(vHeight, 1.2));

    // Cel-shaded inspired lighting
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
    float NdotL = max(dot(vec3(0.0, 0.0, 1.0), lightDir), 0.0);
    // Soft stylized lighting
    float lighting = 0.4 + 0.6 * NdotL;

    // Subtle subsurface scattering approximation (backlit glow)
    float backLight = max(dot(vec3(0.0, 0.0, -1.0), lightDir), 0.0) * 0.15;
    lighting += backLight * vHeight;

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
    this.count = options.count ?? 100000;
    this.areaSize = options.areaSize ?? 50;
    this.bladeHeight = options.bladeHeight ?? 0.8;
    this.windStrength = options.windStrength ?? 0.4;

    this._buildGeometry();
    this._createMaterial();
    this._createMesh();
  }

  _buildGeometry() {
    const count = this.count;
    const areaSize = this.areaSize;
    const bladeHeight = this.bladeHeight;

    const baseWidth = 0.04;
    const topWidth = 0.008;
    const halfBase = baseWidth / 2;
    const halfTop = topWidth / 2;

    // 6 vertices per blade (2 triangles, non-indexed)
    const vertCount = count * 6;

    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);
    const normals = new Float32Array(vertCount * 3);
    const windData = new Float32Array(vertCount * 2);

    const BL = 0, BR = 1, TR = 2, TL = 3;
    // Triangle 1: BL, BR, TR
    // Triangle 2: BL, TR, TL
    const triOrder = [BL, BR, TR, BL, TR, TL];

    for (let i = 0; i < count; i++) {
      // Random position in 50x50 area
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;

      // Random Y rotation so blades face all directions
      const yaw = Math.random() * Math.PI * 2;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      // Height variation
      const heightMul = 0.7 + Math.random() * 0.6;
      const h = bladeHeight * heightMul;

      // Wind phase
      const windPhase = Math.random();

      // Vibrant grass color — stylized Genshin/Zelda style
      const hue = 110 + Math.random() * 30;        // 110-140 (greens)
      const sat = 0.5 + Math.random() * 0.3;        // 0.5-0.8
      const lum = 0.35 + Math.random() * 0.2;       // 0.35-0.55
      const [r, g, b] = hslToRgb(hue, sat, lum);

      // 4 local blade vertices (in XY plane, Z=0)
      const lVerts = [
        [-halfBase, 0.0],   // BL
        [ halfBase, 0.0],   // BR
        [ halfTop,  h],     // TR
        [-halfTop,  h],     // TL
      ];

      // Normal: blade faces perpendicular to its width
      // In local space: (0, 0, 1), rotated around Y by yaw
      const nx = sinY;
      const nz = cosY;

      const base = i * 6 * 3; // base index in float arrays
      const windBase = i * 6 * 2;

      for (let j = 0; j < 6; j++) {
        const vi = triOrder[j];
        const [lx, ly] = lVerts[vi];

        // Rotate the width component around Y, then add base position
        const wx = x + lx * cosY;
        const wz = z + lx * sinY;

        const pIdx = base + j * 3;
        positions[pIdx]     = wx;
        positions[pIdx + 1] = ly;
        positions[pIdx + 2] = wz;

        const cIdx = base + j * 3;
        colors[cIdx]     = r;
        colors[cIdx + 1] = g;
        colors[cIdx + 2] = b;

        const nIdx = base + j * 3;
        normals[nIdx]     = nx;
        normals[nIdx + 1] = 0;
        normals[nIdx + 2] = nz;

        const wIdx = windBase + j * 2;
        windData[wIdx]     = windPhase;
        windData[wIdx + 1] = heightMul;
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    this.geometry.setAttribute('windData', new THREE.Float32BufferAttribute(windData, 2));
  }

  _createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: this.windStrength },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
  }

  _createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
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
