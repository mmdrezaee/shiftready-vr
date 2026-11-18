# ShiftReady VR

Construction site hazard recognition training in WebXR. It runs in the Meta Quest Browser ("Enter VR") or any desktop or phone browser, with nothing to install.

**Live:** https://mmdrezaee.github.io/shiftready-vr/ (trainer at `/trainer/`)

## What it does

- A fictional site safety procedure (SP-CON-012) lists six rules. During a shift, each rule is converted into a live situation on a procedurally built construction site:

  | Rule | Situation |
  | --- | --- |
  | 3.2 Suspended loads | A worker walks under the tower crane's load |
  | 4.1 Open edges | A guardrail section is missing on the top floor and a worker stands at the edge |
  | 5.4 Trenches | A worker climbs into the unshored part of a 2.4 m trench |
  | 6.2 Reversing trucks | A dump truck reverses with no spotter while a worker walks behind it |
  | 6.5 Excavator swing | A worker walks into the swing radius of a working excavator |
  | 7.3 Overhead power lines | A boom truck raises its boom toward the power line with no spotter |

- Distractors look risky but follow the rules (a worker in the trench box, a worker behind a guardrail, a flagger, a walkway). Picking them counts as a false alarm.
- Three roles (new worker, experienced trade worker, site supervisor) set the starting skill, response window and hint threshold.
- Scoring: 100 points plus up to 100 for speed, multiplied by the streak. Badges for first catch, sharp eyes, hat trick, bounce back and a clean shift.
- A learner profile per rule adapts the next situation: weaker rules come up more often and the response window shrinks as skill grows.
- Head gaze records when each hazard was first looked at. The debrief exports a CSV with reaction time, first look, look-to-catch time, false alarms, points and skill.
- Riley, a virtual safety coach, gives feedback and answers questions from the procedure text (offline). Browser speech is used where available; the Quest Browser shows subtitles.
- All sound is synthesized with the Web Audio API and positioned in 3D: engines, a reversing alarm, site ambience and feedback cues.

## Controls

- **VR:** point with a controller and pull the trigger; thumbstick for snap turn. Panels for the procedure, score and coach stand around the viewing deck.
- **Laptop or phone:** drag to look, click or tap hazards. The procedure, score and coach appear as an on-screen overlay. Type questions for Riley in the box at the bottom.

## Optional AI answers

Riley answers from the procedure text by default. To use an AI model instead, set `window.SHIFTREADY_CONFIG.proxyUrl` in `trainer/index.html` to a server that accepts `POST {question, state}` and returns `{reply}`. Keep any API key on that server, never in the page.

## Build

```bash
npm install
./build.sh                         # bundles src/ into build/trainer.html
cp build/trainer.html trainer/index.html
```

Built with three.js 0.160 and esbuild. All geometry and textures are procedural; there are no external assets.

## Note

The procedure SP-CON-012 and the site are fictional and for demonstration only. Always follow your own site's procedures and provincial OHS requirements.

Prototype by Mohammad Rezaeiashtiani.
