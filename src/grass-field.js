import * as THREE from 'three';

class GrassField {
  constructor(options = {}) {
    this.count = options.count ?? 5000;
    this.areaSize = options.areaSize ?? 50;
    this.bladeHeight = options.bladeHeight ?? 1.0;
    this.windStrength = options.windStrength ?? 0.0;

    this._build();
  }

  _build() {
    const count = this.count;
    const areaSize = this.areaSize;
    const bladeHeight = this.bladeHeight;

    // Bigger blades so they're clearly visible
    const baseWidth = 0.15;
    const topWidth = 0.05;

    const halfBase = baseWidth / 2;
    const halfTop = topWidth / 2;

    // 6 verts per blade (2 triangles, non-indexed)
    const totalVerts = count * 6;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);

    // Triangle vertex order: BL, BR, TR, BL, TR, TL
    const bl = 0, br = 1, tr = 2, tl = 3;
    const triOrder = [bl, br, tr, bl, tr, tl];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      const yaw = Math.random() * Math.PI * 2;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const h = bladeHeight * (0.7 + Math.random() * 0.6);

      // Bright debug colors: red, green, blue, yellow, magenta, cyan
      const colorset = [
        [0.2, 0.6, 0.2], // dark green
        [0.3, 0.7, 0.2], // medium green
        [0.4, 0.8, 0.1], // bright green
        [0.2, 0.5, 0.3], // forest green
      ];
      const [r, g, b] = colorset[i % 4];

      // 4 local blade corners (in XY plane, Z=0)
      const verts = [
        [-halfBase, 0.0],  // BL
        [ halfBase, 0.0],  // BR
        [ halfTop,  h],    // TR
        [-halfTop,  h],    // TL
      ];

      const base = i * 6 * 3;

      for (let j = 0; j < 6; j++) {
        const vi = triOrder[j];
        const [lx, ly] = verts[vi];

        // Position in world space: rotate width around Y, add base
        const wx = x + lx * cosY;
        const wz = z + lx * sinY;

        const idx = base + j * 3;
        positions[idx]     = wx;
        positions[idx + 1] = ly;
        positions[idx + 2] = wz;

        colors[idx]     = r;
        colors[idx + 1] = g;
        colors[idx + 2] = b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Use MeshBasicMaterial with vertex colors — simplest possible material
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;

    // Store for update method (no-op for now)
    this._material = material;
  }

  updateTime(time) {
    // No wind yet — just a stub
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export default GrassField;
