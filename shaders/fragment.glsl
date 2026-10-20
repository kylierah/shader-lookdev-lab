// Fragment Shader: Custom Procedural Noise & Debug View
varying vec2 vUv;
varying vec3 vNormal;

// Uniforms connected from UI Inspector Panel
uniform float u_noiseScale;
uniform float u_roughness;
uniform float u_maskCutoff;

// 2D Pseudo-random Noise Function
// Ref: Book of Shaders (https://thebookofshaders.com/10/)
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Value Noise Function (Grid & Interpolation)
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation (Hermite Curve)
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // 1. Scale UV coordinates
    vec2 st = vUv * u_noiseScale;

    // 2. Compute Procedural Noise Value (0.0 ~ 1.0)
    float n = noise(st);

    // 3. Apply Mask Cutoff threshold using step/smoothstep
    float mask = smoothstep(u_maskCutoff - 0.05, u_maskCutoff + 0.05, n);

    // 4. Color Mapping: Metal Base Color vs Worn Rust Color
    vec3 baseColor = vec3(0.8, 0.8, 0.85); // Metallic
    vec3 rustColor = vec3(0.45, 0.15, 0.05); // Worn Mask Region
    vec3 finalColor = mix(baseColor, rustColor, mask);

    gl_FragColor = vec4(finalColor, 1.0);
}