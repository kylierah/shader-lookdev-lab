// Fragment Shader: Custom Procedural Noise Library & PBR IBL LookDev View
// Ref: Inigo Quilez (https://iquilezles.org/articles/morenoise/)
// Ref: Google Filament PBR Spec (https://google.github.io/filament/Filament.html)

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition; // [수정] PBR 시선/반사 벡터 연산용 월드 좌표

// Uniforms connected from UI Inspector Panel
uniform float uNoiseScale;
uniform float uRoughness;
uniform float uMetallic;       // [신규] 금속성
uniform float uEnvIntensity;    // [신규] HDRI 조명 강도
uniform sampler2D uEnvMap;      // [신규] HDRI 스튜디오 텍스처
uniform bool uHasEnvMap;       // [신규] HDRI 로드 여부
uniform float uMaskCutoff;

// 런타임 노이즈 모듈화 파라미터
uniform int uNoiseType;      // 0: Value, 1: Perlin, 2: Voronoi, 3: fBm
uniform int uOctaves;        // fBm 옥타브 (1 ~ 8)
uniform float uLacunarity;   // 주파수 증가율
uniform float uGain;         // 진폭 감소율
uniform float uTime;
uniform bool uDebugNoise;    // Raw Noise 디버그 모드

// Equirectangular 360도 HDRI 텍스처 UV 매핑 수식
vec2 sampleEquirectangular(vec3 dir) {
    vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
    uv *= vec2(0.1591, 0.3183);
    uv += 0.5;
    return uv;
}

// ========================================================
// 1. Hash & Random Functions
// ========================================================
float random21(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random22(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return fract(sin(st) * 43758.5453123);
}

// ========================================================
// 2. Modular Noise Algorithms
// ========================================================

// [A] 2D Value Noise
float valueNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random21(i);
    float b = random21(i + vec2(1.0, 0.0));
    float c = random21(i + vec2(0.0, 1.0));
    float d = random21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// [B] 2D Gradient / Perlin Noise
float perlinNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(random22(i + vec2(0.0, 0.0)) * 2.0 - 1.0, f - vec2(0.0, 0.0));
    float b = dot(random22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
    float c = dot(random22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
    float d = dot(random22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) + 0.5;
}

// [C] 2D Cellular / Voronoi Noise
float voronoiNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float minDist = 8.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random22(i + neighbor);
            point = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * point);
            vec2 diff = neighbor + point - f;
            float dist = dot(diff, diff);
            minDist = min(minDist, dist);
        }
    }
    return sqrt(minDist);
}

// [D] Fractal Brownian Motion (fBm)
float fbm(vec2 st, int octaves, float lacunarity, float gain) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * perlinNoise(st * frequency);
        frequency *= lacunarity;
        amplitude *= gain;
    }
    return value;
}

// ========================================================
// 3. Noise Selector
// ========================================================
float evaluateNoise(vec2 st) {
    if (uNoiseType == 0) return valueNoise(st);
    if (uNoiseType == 1) return perlinNoise(st);
    if (uNoiseType == 2) return voronoiNoise(st);
    if (uNoiseType == 3) return fbm(st, uOctaves, uLacunarity, uGain);
    return valueNoise(st);
}

// ========================================================
// 4. Main PBR & IBL Shader Assembly
// ========================================================
void main() {
    vec2 st = vUv * uNoiseScale;
    float n = evaluateNoise(st);

    // 1. Debug View
    if (uDebugNoise) {
        gl_FragColor = vec4(vec3(n), 1.0);
        return;
    }

    // 2. Masking
    float mask = smoothstep(uMaskCutoff - 0.05, uMaskCutoff + 0.05, n);

    // 3. PBR Material Properties
    vec3 albedoMetal = vec3(0.95, 0.93, 0.88); // 밝은 크롬
    vec3 albedoRust  = vec3(0.45, 0.15, 0.05); // 적갈색 부식
    vec3 albedo = mix(albedoMetal, albedoRust, mask);

    float currentMetallic = mix(uMetallic, 0.0, mask);
    float currentRoughness = mix(uRoughness, 0.85, mask);

    // 4. World Vectors
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 R = reflect(-V, N);

    // 5. Fresnel-Schlick Approximation
    vec3 F0 = mix(vec3(0.04), albedo, currentMetallic);
    float NdotV = max(dot(N, V), 0.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);

    // 6. HDRI / Fallback Studio Reflection
    vec3 envColor;
    if (uHasEnvMap) {
        vec2 envUv = sampleEquirectangular(R);
        envColor = texture2D(uEnvMap, envUv).rgb * uEnvIntensity;
    } else {
        // Fallback: 상하 가상 스튜디오 조명 (HDRI 미로드 시 작동)
        float skyFactor = R.y * 0.5 + 0.5;
        envColor = mix(vec3(0.2, 0.2, 0.25), vec3(1.5, 1.5, 1.6), skyFactor) * uEnvIntensity;
    }

    // 7. Lighting Calculations
    vec3 kS = F;
    vec3 kD = (vec3(1.0) - kS) * (1.0 - currentMetallic);

    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
    float NdotL = max(dot(N, lightDir), 0.1);
    vec3 diffuse = kD * albedo * NdotL;

    vec3 specular = envColor * mix(F, albedo, currentMetallic * 0.5) * (1.0 - currentRoughness * 0.7);

    vec3 finalColor = diffuse + specular;