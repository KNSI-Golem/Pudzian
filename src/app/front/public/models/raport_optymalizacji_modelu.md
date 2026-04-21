# Raport z optymalizacji modelu 3D (GLTF)

## Cel interwencji

Dostosowanie struktury kości (szkieletu) zaimportowanego modelu 3D, aby umożliwić bezpośrednie i bezbłędne mapowanie danych z systemu motion capture (MediaPipe) w środowisku Three.js.

## Diagnoza problemu (Stan początkowy)

Oryginalny plik `.gltf` posiadał "zanieczyszczoną" hierarchię szkieletu będącą wynikiem konwersji formatu FBX.

* **Sztuczne węzły:** Pomiędzy właściwymi kośćmi (standardu Mixamo) znajdowały się dziesiątki sztucznych węzłów offsetowych (typu `$AssimpFbx$_PreRotation` i `Translation`).

* **Błędne osie lokalne:** Każdy z tych sztucznych węzłów posiadał unikalną, narzuconą rotację bazową (Bone Roll), przez co osie kości nie pokrywały się z fizycznym kierunkiem kończyn.

## Zagrożenie dla projektu (Dlaczego musieliśmy to naprawić?)

Zostawienie modelu w stanie pierwotnym wymagałoby **nadpisywania błędów modelu w kodzie JavaScript**.
Dla każdej kości programiści musieliby dynamicznie wyliczać i odwracać unikalne kwaterniony kompensujące przed nałożeniem rotacji z MediaPipe. Skutkowałoby to:

1. Drastycznym spadkiem wydajności (dziesiątki dodatkowych operacji macierzowych co klatkę).

2. Złamaną architekturą (kod zależny od błędów konkretnego pliku graficznego).

3. Niemożnością prostego dodawania "socketów" na przedmioty trzymane w dłoniach.

## Wprowadzone zmiany (Proces naprawczy w Blenderze)

Zamiast komplikować kod, naprawiono źródło problemu u podstaw:

1. **Oczyszczenie drzewa kinematycznego:** Przy użyciu zautomatyzowanego skryptu usunięto wszystkie węzły typu `AssimpFbx`, przywracając czystą, bezpośrednią hierarchię kości standardu Mixamo.

2. **Reset osi lokalnych:** Zresetowano orientację (Bone Roll) tak, aby lokalna oś Y każdej kości była idealnie skierowana w stronę kolejnego stawu.

3. **Wypalenie pozy bazowej (Rest Pose):** Zapisano model ze zresetowanymi transformacjami (skala, rotacja, translacja), gwarantując idealną pozę T-Pose na starcie.

## Rezultat i Walidacja

* **Sukces:** Model został pomyślnie zwalidowany. Lokalne osie zachowują się w pełni przewidywalnie w układzie kartezjańskim.

* **Korzyść dla kodu:** Obecny, prosty skrypt animacyjny (`processAnimateJoint`) może po prostu kopiować wektory rotacyjne z MediaPipe (`quaternion.copy()`) w stosunku 1:1, bez potrzeby pisania żadnej dodatkowej matematyki kompensującej. Model działa poprawnie "out of the box".
