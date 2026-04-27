# GOLEM VR: Kompleksowa Dokumentacja Kontekstowa (v. FULL)

Ten dokument jest kompletnym zapisem sesji rozwojowej skupionej na stabilizacji szkieletu GolemVR. Jest przeznaczony dla agent\u00f3w AI i programist\u00f3w przejmuj\u0105cych projekt, aby zapewni\u0107 ci\u0105g\u0142o\u015b\u0107 bez powielania b\u01 Polish\u0119d\u00f3w.

---

## 1. Fundamenty Projektu
- **Cel:** Translacja landmark\u00f3w MediaPipe (Pose + Hands) na stabiln\u0105 animacj\u0115 modelu GLTF w czasie rzeczywistym.
- **Stack:** Next.js (TS), Three.js (Fiber), MediaPipe Tasks Vision API.

## 2. Architektura Kinematyki (Decyzje Projektowe)

### A. Hierarchiczny Ła\u0144cuch R\u0105k (Unified Arm Chain)
Zrezygnowali\u015bmy z izolowanego animowania ko\u015bci na rzecz struktury `ARM_CONFIGS` w `useThreeScene.ts`. 
- **Zasada:** Je\u015bli rami\u0119 (UpperArm) jest niewidoczne, ca\u0142a r\u0119ka (łącznie z d\u0142oni\u0105) przechodzi w tryb fallback.
- **Histereza:** U\u017cywamy `visibilityStatesRef` i `visibilityCountersRef`, aby zapobiec migotaniu modelu przy granicznych poziomach ufno\u015bci detekcji (`VISIBILITY_THRESHOLD = 0.2`).

### B. Strategia Fallbacku (Stan 'hidden')
- **Ewolucja:** Pocz\u0105tkowo fallback wymusza\u0142 orientacj\u0115 globaln\u0105 (T-pose wzgl\u0119dem tu\u0142owia). 
- **Aktualne rozwi\u0105zanie (v37):** Stosujemy **Local Rest Pose**. D\u0142o\u0144 i przedrami\u0119 wracaj\u0105 do pozycji prostoliniowej wzgl\u0119dem swojego rodzica. Dzi\u0119ki temu r\u0119ka zachowuje si\u0119 anatomicznie nawet przy zgi\u0119tym \u0142okciu.

---

## 3. Logika Matematyczna (process.ts)

### Obliczanie Basis (vY, vForward)
Ka\u017cda ko\u015b\u0107 jest definiowana przez wektor d\u0142ugo\u015bci (`vY`) oraz wektor referencyjny p\u0142aszczyzny (`vForward`).
- `uX = normalize(Cross(vY, vForward))`
- `uZ = normalize(Cross(uX, vY))`
Kluczowa jest sp\u00f3jno\u015b\u0107 `uZ`, aby unikn\u0105\u0107 gwa\u0142townych skr\u0119t\u00f3w (roll) wok\u00f3\u0142 osi ko\u015bci.

---

## 4. Saga "Pachy" i Problemy z Rollem

### Problem:
W modelu GLTF ramiona posiada\u0142y widoczn\u0105 "kulk\u0119" stawu na g\u0142\u00f3rze, co wskazywa\u0142o na obr\u00f3cenie ko\u015bci o 180 stopni wzd\u0142u\u017c osi Y (tzw. "pacha na g\u0142\u00f3rze").

### Pr\u00f3by rozwi\u0105zania:
1. **Ad-hoc multiply(180)** w `useThreeScene`: Powodowa\u0142o wykr\u0119canie r\u0105k nad g\u0142ow\u0119 (Gimbal Lock).
2. **Stable Torso Forward (v36)**: Pr\u00f3ba u\u017cycia orientacji klatki piersiowej jako bazy orientacji dla ramion.
   - **Wynik:** Rozwi\u0105zanie teoretycznie poprawne, ale w praktyce MediaPipe dostarcza zaszumione dane przy r\u0119kach blisko cia\u0142a, co powodowa\u0142o nienaturalne "przytulenie" ramion do torsu i wykrzywienie d\u0142oni. **Zmiany cofni\u0119te przez u\u017cytkownika.**

---

## 5. Rejestr B\u0142\u0119d\u00f3w i Rozwi\u0105za\u0144 (Troubleshooting)

### A. Runtime Error: `elbowState is not defined`
- **Przyczyna:** Zmiana nazwy zmiennej w p\u0119tli `ARM_CONFIGS` bez aktualizacji miejsca sprawdzania widoczno\u015bci d\u0142oni.
- **Fix:** Zawsze upewnij si\u0119, \u017ce `handVisible` referuje do nazwy u\u017cytej w aktualnej iteracji p\u0119tli (np. `armState` lub `elbowState`).

### B. Build Error: `Expected ';', '}' or <eof>` w useThreeScene.ts
- **Przyczyna:** Przypadkowe uci\u0119cie linii `joint.quaternion.slerp(...)` podczas refaktoryzacji.
- **Fix:** Przed zapisem sprawd\u017a domkni\u0119cie wszystkich blok\u00f3w `forEach` i poprawno\u015b\u0107 wywo\u0142a\u0144 funkcji Three.js.

### C. Zgnieciony Tors / Odwr\u00f3cone Stopy
- **Przyczyna:** Eksperymentalna zmiana globalnej orientacji miednicy w `processAnimateJoint`.
- **Fix:** **REVERT DO STANU STABILNEGO**. Tors musi opiera\u0107 si\u0119 na stabilnym Forwardzie (`Cross(Up, Side)`). Nie pr\u00f3buj naprawia\u0107 r\u0105k poprzez zmian\u0119 globalnego Forwardu cia\u0142a.

---

## 6. Analiza Wizualna (Wnioski ze screenshot\u00f3w)
- **Problem "T-Rexa":** Przy s\u0142abym o\u015bwietleniu lub r\u0119kach blisko cia\u0142a, landmarki łokcia maj\u0105 tendencję do "zapadania si\u0119" do \u015brodka torsu.
- **Rozwi\u0105zanie:** Zastosowano ni\u017csze warto\u015bci `slerp` (np. `0.2`) dla stabilno\u015bci kosztem op\u00f3\u017anienia, oraz p\u0142ynny powr\u00f3t do Local Rest Pose w trybie `hidden`.

---

## 7. Bie\u017c\u0105cy Stan i Kierunki Rozwoju (Backlog)
- **Stan:** Szkielet jest stabilny, tors i nogi dzia\u0142aj\u0105 poprawnie. R\u0119ce zachowuj\u0105 si\u0119 sp\u00f3jnie dzi\u0119ki hierarchii.
- **Wyzwanie 1:** Naprawa wizualnego rolla barku (pacha) bez destabilizacji ca\u0142ej r\u0119ki. Sugerowane podej\u015bcie: poprawka w macierzy bazowej `processArm` lub r\u0119czne dostrojenie T-pose ko\u015bci rami\u0119 w blenderze (je\u015bli mo\u017cliwe).
- **Wyzwanie 2:** Ustabilizowanie skr\u0119tu szyi i g\u0142owy tak, by reagowa\u0142y na tilt kamery w spos\u00f3b anatomiczny.

---

*Dokument sporz\u0105dzony przez Antigravity na podstawie analizy sesji rozwojowej 21-22 Kwietnia 2026.*
