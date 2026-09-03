# Metty — todo

## Done

- [x] Project README with modes, bell pattern, control model
- [x] Web prototype: absolute full-screen layout (bowl, striker, controls, screen, play)
- [x] Program dial, 4 detented positions, labels around the outside
- [x] Time + stages dials, free-spinning, 40% diameter, stacked to align with program dial
- [x] Segment LCD screen: segment / stages / total
- [x] Working timers driven from a single start epoch
- [x] Synthesised singing-bowl strike (inharmonic partials + mallet transient)
- [x] Bell pattern: 3 open, 1 per boundary, 3 close
- [x] Mobile layout in vertical thirds
- [x] Top row always lit while setting up; "more to come" rule only during a session
- [x] Editable presets — hold Play 3s, display pulses, saved to localStorage
- [x] Hardware plans rewritten against current behaviour

## Verified

Driven in real Chrome against the current build, all passing:

| Check | Result |
|---|---|
| Idle top row, multi-stage | Mettā reads `5 / 40:00 / 08:00` |
| Idle top row, single stage | Custom reads `1 / 10:00 / 10:00` — shown, per the new rule |
| Off | Top row hidden, bottom row unlit ghosts `__:__` |
| Hold-to-save threshold | Storage empty at 1.5 s, written at 3.0 s |
| Saved payload | `metta: {segment: 600, stages: 6}`, other programs written through unchanged |
| Release swallowed | Display stayed at `10:00`; no session started |
| Pulse | Screen fully inverted mid-animation, class self-clears on `animationend` |
| Persistence | Survived reload; dial away and back reloads saved values |
| Hold while Off | Nothing written, Play disabled |
| Hold mid-session | Nothing written |
| Corrupt storage | Falls back to the factory table silently |
| Short press | Still starts the pre-roll, second press cancels |

## Next

- [ ] Buy a bowl and test sustain on different cradles before committing to a mount
- [ ] Order the display shortlist (Sharp breakout + EA DOGXL160W) and compare by eye
- [ ] Decide the aesthetic reconciliation for wood vs. the black-ground language
- [ ] Decide: does the striker arm swing (servo) or stay static (solenoid only) in v1
- [ ] Port the state model to Arduino, matching `web-prototype/app.js` exactly
- [ ] Resolve whether 1-minute detents make the 99:00 top end unreachable in practice
