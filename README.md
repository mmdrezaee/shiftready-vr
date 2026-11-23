# ShiftReady

Site-specific clearance training. Before working on a new site, workers read its orientation documents. ShiftReady turns the same rules into a short live shift on that site, and a worker is cleared for site entry once they have spotted a breach of every rule. It runs in any laptop or phone browser, or in the Meta Quest Browser ("Enter VR"), with nothing to install.

**Live:** https://mmdrezaee.github.io/shiftready-vr/ (trainer at `/trainer/`)

## What it does

- **The usual way.** The trainee first sees page 7 of a 32-page site orientation document (SP-CON-012, fictional), with a reading timer and the line "Every rule is here. None of it is practised."
- **Turn this into training.** Each rule paragraph lights up and a label flies from the page to the place on site where it applies.
- **A live shift.** Each rule becomes a live situation on a procedurally built construction site:

  | Rule | Situation |
  | --- | --- |
  | 3.2 Suspended loads | A worker walks under the tower crane's load |
  | 4.1 Open edges | A guardrail section is missing on the top floor and a worker stands at the edge |
  | 5.4 Trenches | A worker climbs into the unshored part of a 2.4 m trench |
  | 6.2 Reversing trucks | A dump truck reverses with no spotter while a worker walks behind it |
  | 6.5 Excavator swing | A worker walks into the swing radius of a working excavator |
  | 7.3 Overhead power lines | A boom truck raises its boom toward the power line with no spotter |
  | 8.1 Protected ground | A pickup leaves the laydown area and drives into the fenced protected area (topsoil and wildlife corridor) |

- **Clearance.** A shift covers every rule once, plus an extra situation for the weakest rule. Spotting a breach of every rule clears the worker for site entry; any missed rule comes first next shift. The debrief compares the usual way (reading time, nothing practised) with the shift, and can show the page again with each rule marked spotted or not yet.

- Distractors look risky but follow the rules (a worker in the trench box, a worker behind a guardrail, a flagger, a walkway). Picking them counts as a false alarm.
- Three roles (new worker, experienced trade worker, site supervisor) set the starting skill, response window and hint threshold.
- Scoring: 100 points plus up to 100 for speed, multiplied by the streak. Badges for first catch, sharp eyes, hat trick, bounce back and a clean shift.
- A learner profile per rule adapts the shift: missed rules come first, the extra situation goes to the weakest rule, and the response window shrinks as skill grows.
- Head gaze records when each hazard was first looked at. The debrief exports a CSV with reaction time, first look, look-to-catch time, false alarms, points and skill.
- Riley, a virtual site coach, gives feedback and answers questions from the procedure text (offline). Browser speech is used where available; the Quest Browser shows subtitles.
- All sound is synthesized with the Web Audio API and positioned in 3D: engines, a reversing alarm, site ambience and feedback cues.

## Controls

- **Laptop or phone:** drag to look, click or tap hazards. The orientation page, score and coach appear on screen. Type questions for Riley in the box at the bottom.
- **VR (optional):** point with a controller and pull the trigger; thumbstick for snap turn. The page, score and coach panels stand around the viewing deck.

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

The orientation document SP-CON-012 and the site are fictional and for demonstration only. Always follow your own site's procedures and provincial OHS requirements.

Prototype by Mohammad Rezaeiashtiani.
