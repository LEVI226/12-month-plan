# Childeric — PRD

## Problem statement
Build "Childeric", a French-language mobile app (React Native / Expo, Android-first) that
helps a person transform a personal & professional "bilan" (life assessment) into small
daily actions, then stay consistent over time — without feeling judged. Core feelings to
produce: clarté, douceur, continuité. Tone: calm, human, non-culpabilisant.

## User choices (locked)
- Storage: 100% local on device (offline-first, nothing leaves the phone). No backend for
  user data (backend only exposes /api/health).
- Plan: manual creation (no AI generation for now).
- Reminder: hour saved, no push notifications for now.
- Export: both full JSON backup + shareable text summary.
- Design: decided by design expert — "8 Hand-Drawn / Journal" (Fraunces + Nunito, sage &
  faded-clay palette; clay replaces red so missed actions never feel like failure).

## Architecture
- Frontend: Expo SDK 57, expo-router (file-based), React 19 / RN 0.86.
- Local data layer: `src/store/AppStore.tsx` React context persisted to AsyncStorage
  (`@/src/utils/storage`) under key `childeric:v1`.
- Theme tokens in `src/theme.ts` (light + warm dark), `makeStyles()` / `useTheme()`.
- Icons: custom Phosphor-style SVG set (`src/components/Icon.tsx`, react-native-svg).
- Fonts: Fraunces + Nunito bundled in `assets/fonts`, loaded via expo-font.
- Keyboard: react-native-keyboard-controller (KeyboardAwareScrollView + KeyboardStickyView).
- Backend: minimal FastAPI health check only (`/api/health`).

## User personas
- Person in professional transition wanting a clear direction + daily rhythm.
- Person building personal discipline; motivated at first, energy dips later.
- Someone with many ideas but little follow-through, wanting deep self-reflection.

## Core requirements (static)
- Onboarding: prénom, heure de rappel, fuseau détecté.
- Bilan: guided, sectioned, one question per screen, answers optional & saved; freeze at end.
- Plan: ambition (compass) + 1-3 objectives + concrete actions + weekday chips; single active
  plan; materialises 8 weeks of occurrences.
- Aujourd'hui: up to 6 actions, check/uncheck, mood 1-5, optional note, close day; on close
  remaining actions become "non fait" (missed), checkboxes disabled, ceremonial closed state.
- Suivi: jours clôturés, série, petits pas faits/non faits, humeur moyenne, week grid,
  8-week grid, gentle resume messaging (no aggressive gamification).
- Réglages: privacy note, export JSON, export text summary (native share), delete-all with
  confirmation bottom sheet.

## Implemented (2026-06)
- [x] Reconstructed full Expo frontend template (was missing in imported repo).
- [x] Onboarding, Bilan (51 consolidated questions across sections), freeze.
- [x] Plan creation (ambition/objectives/actions/day-chips) + 8-week occurrence generation.
- [x] Aujourd'hui (actions, mood faces, note, close day, closed state).
- [x] Plan, Suivi (stats + week & 8-week grids + mood + resume), Réglages (export JSON/text,
      delete-all confirm sheet).
- [x] 4-tab navigation, light/dark theme, French non-judgmental microcopy.
- [x] Passed full frontend E2E via testing agent (iteration_1).

## Backlog (prioritised)
- P1: Native local reminder notifications at chosen time (requires real build).
- P1: Edit an existing plan / start a new 8-week cycle when one ends.
- P2: Optional AI plan suggestion from the bilan (needs LLM key).
- P2: Bilan section overview / progress-by-section screen.
- P2: Import a previously exported JSON backup.
- P3: Fix `props.pointerEvents deprecated` console warning (library-originated, non-blocking).

## Next tasks
- Await user feedback; likely reminders and plan-cycle renewal next.
