import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import GUI from 'lil-gui';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const container = document.getElementById('viewport-container');
  if (!container) return;
  
  if (container.querySelector('canvas')) {
    container.innerHTML = '';
  }

  // 1. Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0d);

  const camera = new THREE.PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 0, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  container.appendChild(renderer.domElement);

  let controls;
  try {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  } catch (e) {
    console.warn('OrbitControls 로드 경고:', e);
  }

  // 2. Uniforms 정의
  const dummyTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  dummyTexture.needsUpdate = true;

  const uniforms = {
    uTime: { value: 0.0 },
    uNoiseScale: { value: 6.0 },
    uRoughness: { value: 0.20 },
    uMetallic: { value: 0.85 },
    uEnvIntensity: { value: 1.5 },
    uEnvMap: { value: dummyTexture },
    uHasEnvMap: { value: false },
    uMaskCutoff: { value: 0.50 },
    
    uNoiseType: { value: 3 },
    uOctaves: { value: 4 },
    uLacunarity: { value: 2.0 },
    uGain: { value: 0.5 },
    uDebugNoise: { value: false },

    uWarpEnable: { value: true },
    uWarpStrength: { value: 1.2 },
    uWarpIterations: { value: 2 }
  };

  // 3. HDRI Studio Map 로드
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load(
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.background = envMap;
      scene.environment = envMap;
      uniforms.uEnvMap.value = envMap;
      uniforms.uHasEnvMap.value = true;
      texture.dispose();
      pmremGenerator.dispose();
    },
    undefined,
    (err) => console.warn('HDRI 로드 실패 (절차적 조명으로 작동):', err)
  );

  // 4. Shaders
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uNoiseScale;
    uniform float uRoughness;
    uniform float uMetallic;
    uniform float uEnvIntensity;
    uniform sampler2D uEnvMap;
    uniform bool uHasEnvMap;
    uniform float uMaskCutoff;
    
    uniform int uNoiseType;
    uniform int uOctaves;
    uniform float uLacunarity;
    uniform float uGain;
    uniform bool uDebugNoise;

    uniform bool uWarpEnable;
    uniform float uWarpStrength;
    uniform int uWarpIterations;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    vec2 sampleEquirectangular(vec3 dir) {
      vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
      uv *= vec2(0.1591, 0.3183);
      uv += 0.5;
      return uv;
    }

    vec2 hash22(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
    }

    float hash21(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));

      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float perlinNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = dot(hash22(i + vec2(0.0, 0.0)) * 2.0 - 1.0, f - vec2(0.0, 0.0));
      float b = dot(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
      float c = dot(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
      float d = dot(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) + 0.5;
    }

    float voronoiNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 8.0;

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = hash22(i + neighbor);
          point = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * point);
          vec2 diff = neighbor + point - f;
          float dist = dot(diff, diff);
          minDist = min(minDist, dist);
        }
      }
      return sqrt(minDist);
    }

    float fbm(vec2 p, int octaves, float lacunarity, float gain) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * perlinNoise(p * frequency);
        frequency *= lacunarity;
        amplitude *= gain;
      }
      return value;
    }

    float evaluateNoise(vec2 p) {
      if (uNoiseType == 0) return valueNoise(p);
      if (uNoiseType == 1) return perlinNoise(p);
      if (uNoiseType == 2) return voronoiNoise(p);
      if (uNoiseType == 3) return fbm(p, uOctaves, uLacunarity, uGain);
      return valueNoise(p);
    }

    float domainWarp(vec2 p) {
      if (!uWarpEnable) return evaluateNoise(p);

      vec2 q = vec2(
        evaluateNoise(p + vec2(0.0, 0.0)),
        evaluateNoise(p + vec2(5.2, 1.3))
      );

      if (uWarpIterations == 1) {
        return evaluateNoise(p + uWarpStrength * q);
      }

      vec2 r = vec2(
        evaluateNoise(p + uWarpStrength * q + vec2(1.7, 9.2) + 0.15 * uTime),
        evaluateNoise(p + uWarpStrength * q + vec2(8.3, 2.8) + 0.12 * uTime)
      );

      return evaluateNoise(p + uWarpStrength * r);
    }

    void main() {
      vec2 st = vUv * uNoiseScale;
      float n = domainWarp(st);

      if (uDebugNoise) {
        gl_FragColor = vec4(vec3(n), 1.0);
        return;
      }

      float mask = smoothstep(uMaskCutoff - 0.05, uMaskCutoff + 0.05, n);

      vec3 albedoMetal = vec3(0.95, 0.93, 0.88);
      vec3 albedoRust  = vec3(0.45, 0.15, 0.05);
      vec3 albedo = mix(albedoMetal, albedoRust, mask);

      float currentMetallic = mix(uMetallic, 0.0, mask);
      float currentRoughness = mix(uRoughness, 0.85, mask);

      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vWorldPosition);
      vec3 R = reflect(-V, N);

      vec3 F0 = mix(vec3(0.04), albedo, currentMetallic);
      float NdotV = max(dot(N, V), 0.0);
      vec3 F = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);

      vec3 envColor;
      if (uHasEnvMap) {
        vec2 envUv = sampleEquirectangular(R);
        envColor = texture2D(uEnvMap, envUv).rgb * uEnvIntensity;
      } else {
        float skyFactor = R.y * 0.5 + 0.5;
        envColor = mix(vec3(0.2, 0.2, 0.25), vec3(1.5, 1.5, 1.6), skyFactor) * uEnvIntensity;
      }

      vec3 kS = F;
      vec3 kD = (vec3(1.0) - kS) * (1.0 - currentMetallic);

      vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
      float NdotL = max(dot(N, lightDir), 0.1);
      vec3 diffuse = kD * albedo * NdotL;

      vec3 specular = envColor * mix(F, albedo, currentMetallic * 0.5) * (1.0 - currentRoughness * 0.7);

      vec3 finalColor = diffuse + specular;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // 5. lil-gui Inspector UI & Preset Handlers
  let gui;
  try {
    gui = new GUI({ title: 'Shader LookDev Inspector' });

    // Procedural Noise Folder
    const noiseFolder = gui.addFolder('Procedural Noise');
    const noiseAlgorithms = {
      'Value Noise': 0,
      'Perlin Noise': 1,
      'Voronoi (Cellular)': 2,
      'fBm (Fractal)': 3
    };

    noiseFolder.add(uniforms.uNoiseType, 'value', noiseAlgorithms).name('Algorithm');
    noiseFolder.add(uniforms.uNoiseScale, 'value', 1.0, 30.0, 0.1).name('Noise Scale');
    noiseFolder.add(uniforms.uMaskCutoff, 'value', 0.0, 1.0, 0.01).name('Mask Cutoff');

    const fbmFolder = noiseFolder.addFolder('fBm Parameters');
    fbmFolder.add(uniforms.uOctaves, 'value', 1, 8, 1).name('Octaves').onChange(v => uniforms.uOctaves.value = Math.floor(v));
    fbmFolder.add(uniforms.uLacunarity, 'value', 1.0, 4.0, 0.1).name('Lacunarity');
    fbmFolder.add(uniforms.uGain, 'value', 0.1, 0.9, 0.05).name('Gain');

    // Domain Warping Folder
    const warpFolder = gui.addFolder('Domain Warping');
    warpFolder.add(uniforms.uWarpEnable, 'value').name('Enable Warping');
    warpFolder.add(uniforms.uWarpStrength, 'value', 0.0, 4.0, 0.1).name('Warp Strength');
    warpFolder.add(uniforms.uWarpIterations, 'value', { 'Single (1 Iter)': 1, 'Double (2 Iter)': 2 }).name('Iterations');

    gui.add(uniforms.uDebugNoise, 'value').name('Debug Raw Noise');

    // PBR Surface Folder
    const surfaceFolder = gui.addFolder('PBR Surface & IBL');
    surfaceFolder.add(uniforms.uRoughness, 'value', 0.0, 1.0, 0.01).name('Roughness');
    surfaceFolder.add(uniforms.uMetallic, 'value', 0.0, 1.0, 0.01).name('Metallic');
    surfaceFolder.add(uniforms.uEnvIntensity, 'value', 0.0, 5.0, 0.1).name('Env Intensity');

    // [신규] Preset Data Management Folder (JSON Export / Import)
    const presetFolder = gui.addFolder('Preset Data Management');

    const presetActions = {
      exportPreset: () => {
        const presetData = {
          meta: {
            tool: 'Shader LookDev Lab',
            version: '1.0.0',
            materialXTarget: 'standard_surface',
            timestamp: new Date().toISOString()
          },
          parameters: {
            uNoiseType: uniforms.uNoiseType.value,
            uNoiseScale: uniforms.uNoiseScale.value,
            uMaskCutoff: uniforms.uMaskCutoff.value,
            uOctaves: uniforms.uOctaves.value,
            uLacunarity: uniforms.uLacunarity.value,
            uGain: uniforms.uGain.value,
            uWarpEnable: uniforms.uWarpEnable.value,
            uWarpStrength: uniforms.uWarpStrength.value,
            uWarpIterations: uniforms.uWarpIterations.value,
            uRoughness: uniforms.uRoughness.value,
            uMetallic: uniforms.uMetallic.value,
            uEnvIntensity: uniforms.uEnvIntensity.value
          }
        };

        const jsonStr = JSON.stringify(presetData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `lookdev_preset_${Date.now().toString().slice(-6)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importPreset: () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              const params = data.parameters || data;

              Object.keys(params).forEach((key) => {
                if (uniforms[key] !== undefined) {
                  uniforms[key].value = params[key];
                }
              });

              // lil-gui 슬라이더 UI 갱신
              gui.controllersRecursive().forEach(controller => controller.updateDisplay());
              alert('프리셋 로드 완료!');
            } catch (err) {
              alert('유효하지 않은 프리셋 JSON 파일입니다.');
            }
          };
          reader.readAsText(file);
        };

        fileInput.click();
      }
    };

    presetFolder.add(presetActions, 'exportPreset').name('💾 Export JSON Preset');
    presetFolder.add(presetActions, 'importPreset').name('📂 Import JSON Preset');

    noiseFolder.open();
    warpFolder.open();
    surfaceFolder.open();
    presetFolder.open();
  } catch (e) {
    console.warn('lil-gui 로드 경고:', e);
  }

  // 6. Resize & Render Loop
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();
    sphere.rotation.y += 0.003;
    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  animate();
}