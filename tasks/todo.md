# Metty — todo

## Done

- [x] Project README with modes, bell pattern, control model
- [x] Web prototype: absolute full-screen layout (bowl, striker, controls, screen, play)
- [x] Program dial, 4 detented positions, labels around the outside
- [x] Duration + reps dials, free-spinning, 40% diameter, stacked to align with program dial
- [x] Segment LCD screen: segment / reps / total
- [x] Working timers driven from a single start epoch
- [x] Synthesised singing-bowl strike (inharmonic partials + mallet transient)
- [x] Bell pattern: 3 open, 1 per boundary, 3 close
- [x] Mobile layout in vertical thirds
- [x] Hardware planning doc

## Verified

Headless Chrome self-test, all passing:

| Check | Result |
|---|---|
| Metta preset | `10:00 / 4 / 40:00` |
| Body scan preset | `30:00 / 1 / 30:00` |
| Custom preset | `10:00 / 1 / 10:00` |
| Duration +2 steps | segment `11:00`, total follows |
| Reps ×3 | total `33:00` |
| Clamp at floor | holds at `00:30`, no negatives |
| OFF pointer bearing | `rotate(-45deg)` — north-west, matches label |
| Full 3-rep session | ran to completion, RUN flag cleared |
| Strike count | **8** = 3 open + 2 boundaries + 3 close |

Two bugs found and fixed by this test:
- Program dial angle map was inverted against the `atan2` convention — the pointer
  indicated the wrong label.
- `hidden` is not honoured on SVG children by the UA stylesheet, so the play and stop
  glyphs drew on top of each other.

## Next

- [ ] Decide: does the striker arm swing (servo) or stay static (solenoid only) in v1
- [ ] Buy a bowl and test sustain on different cradles before committing to a mount
- [ ] Pick the display and confirm 6 digits is enough for three fields
- [ ] Port the state model to Arduino, matching `web-prototype/app.js` exactly
