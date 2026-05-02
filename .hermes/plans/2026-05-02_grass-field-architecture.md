# Grass Field Experiments — Implementation Plan

> **For Hermes:** Use deepseek-pro-plus-flash workflow to implement this. I (main agent, DeepSeek Pro) handle architecture. Subagents (DeepSeek Flash) handle implementation.

**Goal:** GPU-instanced 3D grass field renderer using Three.js with wind simulation, camera controls, and tunable parameters.

**Architecture:** Single-page HTML app using Three.js (ES modules via CDN importmap). Grass rendered via InstancedMesh with custom ShaderMaterial for vertex-shader wind animation. OrbitControls for free camera movement.

**Tech Stack:** Three.js r160+ (CDN via unpkg/esm.sh), plain JavaScript ES modules, GLSL shaders.

---

### Repository Structure

```
grass-field-experiments/
├── index.html           # Entry point, loads Three.js via importmap
├── src/
│   ├── main.js          # Scene setup, lighting, animation loop, UI params
│   ├── grass-field.js   # GrassField class — InstancedMesh + custom material
│   └── shaders/
│       ├── grass.vert.glsl  # Vertex shader: wind, bend, tip displacement
│       └── grass.frag.glsl  # Fragment shader: color variation, lighting
└── README.md
```

---

### Task 1: Create entry point (index.html)

**Objective:** HTML page with Three.js importmap, module script loading, fullscreen canvas

**Files:**
- Create: `index.html`

**Details:**
- Importmap pointing to Three.js (r160+) from `https://unpkg.com/three@0.160.0/build/three.module.js` and addons from `https://unpkg.com/three@0.160.0/examples/jsm/`
- CSS: black background, margin 0, overflow hidden, full viewport canvas
- Type="importmap" mapping:
  - `three` -> three.module.js
  - `three/addons/` -> examples/jsm/
- Type="module" script loading `src/main.js`
- Optional: small overlay text with FPS and controls hint (wasd, click-drag)

---

### Task 2: Create vertex shader (src/shaders/grass.vert.glsl)

**Objective:** Animate grass blades with wind and height-based bending

**Files:**
- Create: `src/shaders/grass.vert.glsl`

**Details:**
Inputs:
- `instancePosition` (vec3) — per-instance attribute: base position
- `instanceRandomOffset` (float) — per-instance random value [0-1] for wind phase variation
- `instanceHeightScale` (float) — per-instance height multiplier [0.7-1.3]
- `instanceColor` (vec3) — per-instance base color
- `uTime` (float) — time uniform for wind animation
- `uWindStrength` (float) — wind intensity
- `uWindFrequency` (float) — wind wave frequency

Logic:
1. Standard model-view-projection transform
2. Wind displacement: `sin(uTime * 2.0 + position.x * uWindFrequency + instanceRandomOffset * 6.28) * uWindStrength`
3. Apply more displacement at blade tip (y position) — multiply wind by `position.y` (assumes blade goes from y=0 to y=1)
4. Pass `instanceColor` as varying to fragment shader
5. Pass `vUv` (or just vHeight = position.y) for tip coloring

---

### Task 3: Create fragment shader (src/shaders/grass.frag.glsl)

**Objective:** Color grass blades with natural variation and simple lighting

**Files:**
- Create: `src/shaders/grass.frag.glsl`

**Details:**
Inputs:
- `vColor` (vec3) — from vertex shader (instance base color)
- `vHeight` (float) — normalized height [0-1] along the blade
- `vNormal` (vec3) — computed in vertex shader for lighting

Logic:
1. Base color is interpolated from dark green (bottom) to lighter/yellowish green (tip): `mix(vColor * 0.6, vColor * 1.3, vHeight)`
2. Simple directional light contribution (dot product with light direction)
3. Add slight ambient light (0.3)
4. Output final color

---

### Task 4: Create GrassField class (src/grass-field.js)

**Objective:** GPU-instanced grass rendering with configurable parameters

**Files:**
- Create: `src/grass-field.js`

**Details:**

```javascript
class GrassField {
  constructor(options = {}) {
    this.count = options.count ?? 50000;
    this.areaSize = options.areaSize ?? 50;
    this.bladeHeight = options.bladeHeight ?? 0.8;
    this.windStrength = options.windStrength ?? 0.3;
    this.windFrequency = options.windFrequency ?? 0.5;
    this.density = options.density ?? 0.8;
    // ... setup
  }
}
```

**Grass blade geometry:**
- A single blade: 2 triangles forming a thin quad, slightly tapered at top
- Vertices: bottom-left, bottom-right, top-center — or a flat thin quad
- UV: y=0 at base, y=1 at tip

**Per-instance attributes (InstancedBufferAttribute):**
- `instancePosition`: random x,z within area (plus optional jitter)
- `instanceRandomOffset`: random float [0-1] for wind phase
- `instanceHeightScale`: random [0.7-1.3] for variation
- `instanceColor`: random green hue variation (HSL: H 100-140, S 40-70%, L 30-50%)

**ShaderMaterial:**
- vertexShader: embed shader source
- fragmentShader: embed shader source
- uniforms: uTime, uWindStrength, uWindFrequency, uLightDirection
- Side: DoubleSide (or spec for thin geometry)

**Methods:**
- `updateTime(time)` — update uTime uniform
- `setWindStrength(value)` — update wind
- `dispose()` — cleanup

---

### Task 5: Create main.js (src/main.js)

**Objective:** Scene setup, controls, lighting, UI parameters, animation loop

**Files:**
- Create: `src/main.js`

**Details:**
- Import from three: Scene, PerspectiveCamera, WebGLRenderer, Color
- Import from three/addons/: OrbitControls
- Import GrassField

**Setup:**
1. Scene with sky-blue background (or gradient)
2. PerspectiveCamera (75 FOV, positioned at (0, 15, 25) looking at origin)
3. WebGLRenderer with antialiasing, pixel ratio
4. OrbitControls with damping, auto-rotate false, max polar angle limit
5. AmbientLight (0x404060, 0.4) + DirectionalLight (0xffeedd, 0.8) from top-right

**Ground:**
- Optional: a simple ground plane (flat circle or grid helper) to show terrain context
- MeshBasicMaterial, slightly translucent or as reference grid

**GrassField:**
- Instantiate with 50000-100000 blades in a 40x40 area
- Adjust default parameters for good visual result

**Animation loop:**
- RequestAnimationFrame
- `grassField.updateTime(clock.getElapsedTime())`
- `controls.update()`
- `renderer.render(scene, camera)`

**Event handlers:**
- Resize handler for window resize

---

### Task 6: Create README.md

**Objective:** Project documentation

**Files:**
- Create: `README.md`

**Details:**
- Title and description
- Quick start (open index.html in browser, or serve with `npx serve`)
- Controls (orbit, zoom, pan)
- Parameter tuning (density, wind, colors)
- Screenshot placeholder
- Tech stack and credits

---

### Task 7: Verify and polish

**Objective:** Ensure everything works together

- Serve with `python3 -m http.server` or `npx serve`
- Open in browser, verify:
  - Grass renders with instancing (no errors in console)
  - Wind animation is smooth
  - Orbit controls work
  - Colors look natural
  - Performance is acceptable (60fps at 50k blades)
- Tweak any parameters for best visual result
- Commit and push all changes
