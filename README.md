# Shader LookDev Lab (Procedural Material R&D Toolkit)

언리얼 엔진 5 / 유니티 6 등 상용 엔진 이식 전, 엔진 재컴파일 대기 없이 브라우저 환경에서 GLSL 절차적 노이즈 및 PBR 머티리얼을 검증하고 

프로토타이핑하는 초경량 LookDev 샌드박스입니다.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://kylierah.github.io/shader-lookdev-lab/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![GLSL](https://img.shields.io/badge/GLSL-WebGL2-blue?style=for-the-badge&logo=opengl)](https://www.khronos.org/opengl/)

---

## 📌 Main Demo

![Shader LookDev Lab Demo Preview](./assets/demo_preview.gif)
*Real-time Domain Warping & Procedural Noise R&D in WebGL*

---

## Background & Problem Statement

실무 게임/영상 제작 파이프라인에서 셰이더 LookDev 및 R&D 과정 중 발생하는 3가지 주요 병목을 해결하기 위해 개발된 웹 워크벤치입니다.

### 1. 무거운 DCC/엔진에서의 셰이더 R&D 병목 (Prototyping Latency)
* **Problem:** 언리얼/유니티/Houdini 등 중대형 엔진에서 복잡한 절차적 노이즈(마그마, 유기체, 암석 등)를 R&D할 때 컴파일 대기 시간과 높은 오버헤드가 발생합니다.
* **Solution:** 초경량 WebGL2 / GLSL 샌드박스를 구축하여 브라우저에서 제로 대기시간으로 fBm 및 Domain Warping 수식을 실시간 튜닝합니다.

### 2. PBR 조명 차폐로 인한 수학적 수치 검증 불가 (Raw Inspection)
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

본 프로젝트는 아래의 공식 산업 표준 명세 및 레퍼런스를 바탕으로 설계되었습니다.

### 1. Engine & Material Pipeline Standards
* **[MaterialX & OpenUSD Standard (ASWF)](https://materialx.org/):** 루카스필름/ASWF 오픈소스 재질 메타데이터 데이터 교환 포맷 및 노드 데이터 구조
* **[Unreal Engine 5 Substrate Material System](https://dev.epicgames.com/documentation/en-us/unreal-engine/substrate-materials-in-unreal-engine):** 차세대 모듈형 머티리얼 및 LookDev 파이프라인 구조
* **[W3C WebGL2 Specifications](https://www.khronos.org/registry/webgl/specs/latest/2.0/):** 실시간 웹 그래픽스 파이프라인 표준 명세

### 2. PBR Theory & LookDev Framework
* **[Google Filament PBR Specification](https://google.github.io/filament/Filament.html):** PBR 표면 렌더링, Fresnel-Schlick 및 에너지 보존 법칙 표준 명세
* **[Epic Games - Real Shading in Unreal Engine 4 (Brian Karis, SIGGRAPH)](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes.pdf):** GGX BRDF 및 실시간 PBR 수학적 근거
* **[EA Frostbite - Moving Frostbite to PBR (Sébastien Lagarde)](https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf):** 표준화된 LookDev 조명 통제 및 재질 칼리브레이션 평가 방법론
* **[Adobe Substance 3D - The PBR Guide](https://substance3d.adobe.com/tutorials/courses/the-pbr-guide-part-1):** 물리 기반 재질 측정값 및 파라미터 기준

### 3. Procedural Noise & Shader Algorithms
* **[Inigo Quilez - Procedural Noise & Domain Warping](https://iquilezles.org/articles/warp/):** 2D/3D Value, Perlin, Voronoi 및 좌표 왜곡(Domain Warping) 알고리즘 원론
* **[The Book of Shaders (Patricio Gonzalez Vivo)](https://thebookofshaders.com/):** GLSL 절차적 패턴 및 노이즈 구현 아키텍처

### 4. Interactive UI & Data Pipeline
* **[lil-gui Documentation](https://lil-gui.georgealways.com/):** WebGL Uniform 파라미터 바인딩 및 실시간 인스펙터 패널 구축
* **[Three.js OrbitControls Specification](https://threejs.org/docs/#examples/en/controls/OrbitControls):** LookDev 뷰포트 카메라 인터랙션 파이프라인
* **[MDN Web Docs - File API & Blob](https://developer.mozilla.org/en-US/docs/Web/API/FileReader):** 클라이언트 사이드 JSON 프리셋 I/O 데이터 파이프라인

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

