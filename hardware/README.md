# Metty — hardware plans

Arduino-based build. This folder holds the electronics, mechanical and firmware
planning. Nothing here is committed to yet; the web prototype is the reference for
how the thing must *behave*, and this describes how to make it behave that way in
physical parts.

## Design constraints

1. **The bell is real.** No speaker, no samples. A struck bowl is the entire point.
2. **No backlight.** A reflective segment LCD, readable in daylight, invisible-ish
   at night. A meditation timer that glows in a dark room is a distraction.
3. **The controls are the interface.** No phone, no app, no wifi, no companion
   anything. Everything is reachable with your hands in under three seconds.
4. **It must survive being wrong.** A hung timer in the middle of a 40-minute sit is
   the worst possible failure. Watchdog on, and a hardware power switch.

---

## Block diagram

```
 [4-pos rotary switch] ──┐
 [encoder: duration]  ───┤
 [encoder: reps]      ───┼──> [ MCU ] ──> [ HT1621 segment LCD ]
 [play button]        ───┘        │
                                  └────> [ MOSFET ] ──> [ solenoid striker ]

 [12V in] ──> [buck 5V] ──> logic
          └────────────────> solenoid rail (separate, bulk cap)
```

---

## Bill of materials (first pass)

| Part | Suggested | Notes |
|---|---|---|
| MCU | Arduino Nano Every, or ESP32 dev board | See "pin pressure" below — this is the main open decision. |
| Program selector | SP4T rotary switch, detented | Resistor ladder into one ADC pin. Real detents matter for feel. |
| Duration encoder | EC11 rotary encoder, detented, no end stop | Free-spinning, matching the prototype. |
| Reps encoder | EC11 rotary encoder, detented | Same. |
| Display | HT1621 6-digit reflective LCD | 3-wire, no backlight, low power. |
| Striker | 12V push solenoid (e.g. JF-0530B) + felt/leather mallet tip | Flyback diode **mandatory**. |
| Driver | Logic-level N-MOSFET (IRLZ44N) + 1N4007 flyback | Plus 1000µF bulk cap on the solenoid rail. |
| Play button | 16mm momentary, panel mount | Debounced in firmware. |
| Power | 12V 2A supply + buck converter to 5V | Solenoid inrush must not brown out the MCU. |
| Bowl | Tibetan singing bowl, ~12–15cm | Pitch and sustain vary hugely — buy by ear. |
| Cradle | Felt ring or three O-ring standoffs | **Critical:** see mechanical notes. |

---

## Mechanical notes

### The bowl must be decoupled

A bowl clamped or glued to the plinth will not ring — it will thud. The mounting has
to touch as little of the bowl as possible and damp as little as possible. Options,
roughly in order of preference:

1. Three small O-ring standoffs contacting the outer base only.
2. A felt or cork ring supporting the base rim.
3. A traditional cushion recessed into the plinth.

Prototype this before anything else. If the bowl doesn't sustain, the whole project
is pointless, and it's cheap to find out early.

### Striker geometry

The arm is fixed, sitting over the bowl like a tonearm at rest. The solenoid lives at
the arm's far end with the mallet on its plunger, striking **the rim** — the rim gives
the fullest tone; striking the belly or base sounds dead.

The mallet tip must be soft (felt, leather, or a suede-wrapped hardwood core). A bare
plunger on metal gives a metallic *clack* over the tone.

Strike energy needs tuning: too soft is inaudible across a room, too hard is startling
— which in a meditation timer is a genuine design failure, not a minor annoyance. Plan
on a trimmer pot or a compile-time constant for pulse width (start around 15–30ms) and
tune by ear.

### Future: the record-player motion

v1 keeps the arm static. If the arm should *swing* in like a tonearm, add a servo at
the pivot — but note this is pure theatre, and theatre that costs you a moving part
that can fail mid-session. Ship v1 static.

---

## Pin pressure — the main open decision

An ATmega328 Nano has only two external-interrupt pins (D2, D3), and two quadrature
encoders want four. Three ways out:

- **Pin-change interrupts** on a whole port. Works on a 328, more fiddly firmware.
- **Poll the encoders** in a fast timer ISR (~1kHz). Detented EC11s are slow enough by
  hand that polling is entirely adequate, and it's the simplest correct option.
- **Move to ESP32.** Interrupts on any pin, plus a hardware pulse-counter peripheral,
  and vastly more headroom. Costs a little more power and a lot more boot time.

**Recommendation: poll the encoders on a timer ISR, stay on the Nano Every.** Human
fingers cannot outrun a 1kHz poll, and it keeps the parts count and the power budget
low. Revisit only if the display refresh starts fighting the poll.

## Timekeeping

A crystal-based Nano drifts roughly ±50ppm — about ±0.12s across a 40-minute sit,
which is irrelevant here. **No RTC needed.** Do not use `delay()` for session timing;
run everything from a single `millis()` epoch captured at start, exactly as the web
prototype computes from `startedAt`. Deriving current rep and remaining time from one
epoch (rather than accumulating per-segment) means drift cannot compound across reps.

## Firmware behaviour

Must match `web-prototype/app.js` exactly. That file is the specification:

- Presets: Off; Metta 10:00×4; Body scan 30:00×1; Custom 10:00×1.
- Selecting a program **loads** segment and reps; the dials stay live afterwards.
- Duration steps in 30s units, clamped to 0:30 … 99:00.
- Reps clamped to 1 … 99.
- Bell: three strikes to open, one at each segment boundary, three to close.
  Spacing between strikes in a triple: ~1.7s.
- A single-segment program has no interior strikes.
- Stopping early is silent — no closing bell on a manual stop.
- Display: segment time, reps (`2/4` while running), total remaining.

## Open questions

- [ ] Does the chosen bowl sustain long enough that a 1.7s triple-strike spacing sounds
      right, or does it need to be longer?
- [ ] Solenoid noise: does the plunger's mechanical clack carry through the plinth into
      the bowl? May need isolation mounts for the solenoid too.
- [ ] Is 6 digits enough, or does the display need a third line for total time?
- [ ] Battery option, or mains only?
- [ ] Enclosure material — the plinth's mass and damping affect the tone.
