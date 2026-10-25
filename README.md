# Shader LookDev Lab (Procedural Material R&D Toolkit)

언리얼 엔진 5 / 유니티 6 등 상용 엔진 이식 전, 엔진 재컴파일 대기 없이 브라우저 환경에서 

GLSL 절차적 노이즈 및 PBR 머티리얼을 검증하고 프로토타이핑하는 초경량 LookDev 샌드박스입니다.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://kylierah.github.io/shader-lookdev-lab/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![GLSL](https://img.shields.io/badge/GLSL-WebGL2-blue?style=for-the-badge&logo=opengl)](https://www.khronos.org/opengl/)


## 📌 Main Demo

![Shader LookDev Lab Demo Preview](./assets/demo_preview.gif)
*Real-time Domain Warping & Procedural Noise R&D in WebGL*

## Background & Problem Statement

실무 게임/영상 제작 파이프라인에서 셰이더 LookDev 및 R&D 과정 중 발생하는 3가지 주요 병목을 해결하기 위해 개발된 웹 워크벤치입니다.

### 1. 무거운 DCC/엔진에서의 셰이더 R&D 병목 (Prototyping Latency)
* **Problem:** 언리얼/유니티/Houdini 등 중대형 엔진에서 복잡한 절차적 노이즈(마그마, 유기체, 암석 등)를 R&D할 때 컴파일 대기 시간과 높은 오버헤드가 발생합니다.
* **Solution:** 초경량 WebGL2 / GLSL 샌드박스를 구축하여 브라우저에서 제로 대기시간으로 fBm 및 Domain Warping 수식을 실시간 튜닝합니다.

### 2. PBR 조명 및 그림자 처리로 인한 수학적 수치 검증 불가 (Raw Inspection)
* **Problem:** 화려한 PBR 조명과 반사광으로 인해 셰이더 바탕이 되는 노이즈 수치(0.0~1.0)의 수학적 오차나 버그를 직관적으로 진단하기 어렵습니다.
* **Solution:** **LookDev Debug Pass (`uDebugNoise`)**를 탑재하여 버튼 하나로 PBR 연산을 우회하고 원본 흑백 노이즈 맵을 즉시 진단합니다.

### 3. 직군 간 파라미터 유실 및 데이터 파편화 (Parameter Drift)
* **Problem:** TA와 3D 아티스트 간 셰이더 수치 전달 시 메모장/캡처 이미지 사용으로 인해 세팅값이 누락되거나 이관 오류가 빈번합니다.
* **Solution:** **MaterialX 메타데이터 연동 JSON Import/Export** 파이프라인 기반으로 파라미터 상태의 일관성을 유지합니다.

---

## Feature Breakdown

### 1. Procedural Noise & Domain Warping Engine
* **fBm (Fractal Brownian Motion):** Octaves, Lacunarity, Gain 파라미터 제어를 통한 멀티 스케일 디테일 합성.
* **Domain Warping:** Inigo Quilez 모델 기반의 1차/2차 좌표 왜곡 알고리즘 구현으로 유기적 액체 질감 연출.
* **Multi-Noise Support:** Value Noise, Perlin Noise, Voronoi (Cellular) 선택 가능.

| Raw Value Debug Pass | JSON Preset Export / Import |
| :---: | :---: |
| ![Debug Pass](./assets/demo_debug.gif) | ![Preset Export](./assets/demo_preset.gif) |
| *PBR 라이팅 우회 후 원본 수치 검증* | *MaterialX 호환 프리셋 저장 및 UI 재동기화* |

### 2. Physically Based Rendering (PBR) & PMREM IBL
* **Energy Conservation:** Google Filament PBR 명세 및 Fresnel-Schlick 수식을 준수하여 스페큘러 반사의 물리적 정확도 보장.
* **PMREM IBL Pipeline:** `RGBELoader` 및 `PMREMGenerator` 파이프라인을 통한 HDRI 스튜디오 환경 맵 밉맵 전처리 및 반사광 연산.

---

## References & Standards

본 프로젝트는 아래의 공식 산업 표준 명세 및 그래픽스 연구를 기반으로 설계되었습니다.

## 📚 Technical References & Citations

본 프로젝트는 관련 기술 표준 명세, 렌더링 이론 및 공식 개발 문서를 참고하여 설계 및 구현되었습니다.

Technical References & Citations

본 프로젝트는 관련 기술 표준 명세, 렌더링 이론 및 공식 개발 문서를 참고하여 설계 및 구현되었습니다.

1. Engine & Material Pipeline
MaterialX & OpenUSD — Material interchange, shader graphs, and 3D scene description.
Unreal Engine 5 — Substrate Materials — Modular material authoring and shading workflows.
Khronos WebGL 2.0 Specification — Web graphics API specification.

3. PBR Theory & LookDev
Google Filament — Physically Based Rendering — PBR material models, BRDFs, Fresnel reflectance, and energy conservation.
Epic Games — Real Shading in Unreal Engine 4 — Microfacet BRDFs and GGX-based real-time shading.
EA Frostbite — Moving Frostbite to PBR — PBR workflows and material consistency.
Adobe Substance 3D — The PBR Guide — PBR material authoring principles and texture parameters.

4. Procedural Noise & Shader Algorithms
Inigo Quilez — Articles — Procedural noise, domain warping, and shader algorithms.
The Book of Shaders — GLSL fragment shaders, procedural patterns, and noise techniques.

5. Interactive UI & Data Pipeline
lil-gui Documentation — Real-time parameter controls and interactive debugging interfaces.
Three.js — OrbitControls — Interactive 3D viewport camera controls.
MDN — File API & Blob — Client-side file handling and data import/export.

---

## 🚀 Quick Start

```bash
# Repository 클론
git clone [https://github.com/kylierah/shader-lookdev-lab.git](https://github.com/kylierah/shader-lookdev-lab.git)

# 의존성 설치
cd shader-lookdev-lab
npm install

# 로컬 개발 서버 실행
npm run dev

