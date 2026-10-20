import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. DOM Container & Scene
const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d0d);

// 2. Camera
const camera = new THREE.PerspectiveCamera(
  45, 
  container.clientWidth / container.clientHeight, 
  0.1, 
  100
);
camera.position.set(0, 0, 4);

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// 4. OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 5. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 6. Custom GLSL Noise Shader (ShaderMaterial)
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float u_noiseScale;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 st = vUv * u_noiseScale;
    float n = random(floor(st));
    
    // 주황색 / 어두운 검은색 노이즈 모자이크 마스크
    vec3 color = mix(vec3(0.08, 0.08, 0.1), vec3(0.95, 0.45, 0.1), n);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const uniforms = {
  u_noiseScale: { value: 8.0 },
  u_roughness: { value: 0.3 },
  u_maskCutoff: { value: 0.5 }
};

const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: uniforms
});

const geometry = new THREE.SphereGeometry(1, 64, 64);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 7. UI Slider Event Binding
const noiseScaleInput = document.getElementById('noiseScale');
const valNoiseScale = document.getElementById('val-noiseScale');

if (noiseScaleInput) {
  noiseScaleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    uniforms.u_noiseScale.value = val;
    if (valNoiseScale) valNoiseScale.textContent = val.toFixed(1);
  });
}

// 8. Window Resize Event
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// 9. Render Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();