# Lokalne commity nieopublikowane - podsumowanie

## Stan gałęzi

- Lokalnie gałąź `feature/animation-correction` ma **3 commity więcej** niż `origin/main` i **0 commitów mniej**.
- Nie istnieje zdalna gałąź `origin/feature/animation-correction`, więc te commity są obecnie tylko lokalnie.
- Dodatkowo w working tree są niecommitowane zmiany:
  - `src/app/front/src/components/video/usePoseDetection.ts`
  - `src/app/front/src/hooks/useThreeScene.ts`
  - `src/app/front/src/lib/animate/process.ts`
  - `GOLEM_VR_CONTEXT.md` (nowy, nieśledzony)

---

## 1) Commit `e2f38e35aae4bd96e701dc154f36fe73cd61035d`

**Data:** 2026-04-21 22:30:20 +0200  
**Tytuł:** Refactor: implementation of parent inverse rotation for bone hierarchy correction

### Najważniejsze zmiany

- Przełączenie modelu runtime z `result.gltf` na `Final_Cleaned_Model.glb`.
  - `src/app/front/src/app/page.tsx`
- Przebudowa aplikacji rotacji kości na logikę parent inverse rotation.
  - `src/app/front/src/hooks/useThreeScene.ts`
- Korekta mapowania punktów stawów (kolejność shoulder/elbow/wrist).
  - `src/app/front/src/lib/animate/mapping.ts`
- Refaktor matematyki quaternionów i bazy osi.
  - `src/app/front/src/lib/animate/process.ts`
- Dodanie zasobów i dokumentacji modelu:
  - `src/app/front/public/models/Final_Cleaned_Model.glb`
  - `src/app/front/public/models/raport_optymalizacji_modelu.md`
  - `run.sh`
  - `whereCalc.md`

### Skala

- 9 plików zmienionych
- 128 insertions, 46 deletions

---

## 2) Commit `538cf51fbe08786e1426c1d72918e367528664cb`

**Data:** 2026-04-21 23:14:43 +0200  
**Tytuł:** Feature: legs and feet animation support, hand landmarker integration, and mathematical refactoring using UnitVectors

### Najważniejsze zmiany

- Integracja HandLandmarker w pipeline video i hookach:
  - `src/app/front/src/components/video/VideoStream.tsx`
  - `src/app/front/src/components/video/usePoseDetection.ts`
  - `src/app/front/src/hooks/useMediaPipe.ts`
- Rozszerzenie typów pod hand landmarks i hand landmarker:
  - `src/app/front/src/types/mediapipe.ts`
  - `src/app/front/src/types/three.ts`
  - `src/app/front/src/types/animate.ts`
- Dodanie pełnej konfiguracji kości i palców:
  - `src/app/front/src/lib/animate/boneConfig.ts`
- Duże rozszerzenie mapowania i obliczeń dla nóg/stóp/rąk:
  - `src/app/front/src/lib/animate/mapping.ts`
  - `src/app/front/src/lib/animate/process.ts`
  - `src/app/front/src/lib/animate/utils.ts`
- Rozszerzenie warstwy MediaPipe i rysowania dłoni:
  - `src/app/front/src/lib/mediapipe/core.ts`
  - `src/app/front/src/lib/mediapipe/drawing.ts`
- Dodanie pliku analizy hierarchii modelu:
  - `src/app/front/public/models/structureCleanedModel.json`

### Skala

- 15 plików zmienionych
- 1174 insertions, 83 deletions

---

## 3) Commit `10a757da5c4bb8e85c247184f177487b2d1f178d`

**Data:** 2026-04-22 14:53:16 +0200  
**Tytuł:** system works, but the armpit area needs fixing.

### Najważniejsze zmiany

- Duża przebudowa runtime animacji i stabilizacji:
  - `src/app/front/src/hooks/useThreeScene.ts`
  - pełniejsza hierarchia ciała (spine, shoulder, neck, head)
  - osobne ścieżki dla kończyn i stóp
  - histereza widoczności i fallbacki
  - world rest pose + local rest pose logic
  - unified arm chain (łokieć, przedramię, dłoń, palce)
- Rozbudowa metod kinematycznych:
  - `src/app/front/src/lib/animate/process.ts`
  - `processForearmHybrid`
  - `processHandRoot`
  - `processSpine`, `processShoulder`, `processHead`, `processFoot`
  - standaryzacja baz world quaternion
- Dalsza korekta mapowania i konfiguracji szkieletu:
  - `src/app/front/src/lib/animate/mapping.ts`
  - `src/app/front/src/lib/animate/boneConfig.ts`
- Dodanie telemetrii wydajności:
  - `src/app/front/src/lib/perf/perfTracker.ts`
  - `src/app/front/src/components/ui/PerformanceHUD.tsx`
  - podpięcie w `src/app/front/src/app/page.tsx` i `src/app/front/src/components/video/usePoseDetection.ts`
- Mirror renderu modelu:
  - `src/app/front/src/components/video/ModelViewer.tsx`

### Skala

- 10 plików zmienionych
- 764 insertions, 101 deletions

---

## Obraz systemu po tych 3 commitach

- **Detekcja:** Pose + Hands są liczone równolegle i przekazywane jako wspólny wynik do runtime animacji.
- **Kinematyka:** orientacja kości opiera się na bazach wektorowych i konwersji do lokalnej przestrzeni rodzica.
- **Stabilizacja:** wprowadzono histerezę widoczności, fallbacki i slerp, aby ograniczyć jitter oraz skoki.
- **Obserwowalność:** dodano profiling pętli video/pose/hand/three oraz HUD metryk.

---

## Skala łączna (origin/main..HEAD)

- 22 pliki zmienione
- 1936 insertions, 100 deletions
- duże assety binarne modelu (`Final_Cleaned_Model.glb`)
