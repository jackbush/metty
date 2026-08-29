# Metty

A physical meditation timer that looks, from above, a little like a record player.

Instead of a record: a **medicine bowl / bell**.
Instead of a tonearm: a **striker** that swings in to sound the bowl.
Instead of a pickup and speed controls: **dials that program meditation timers**.

The device is deliberately analogue in feel. No app, no phone, no backlight, no
notifications. You set a practice with your hands, press play, and the room fills
with a real struck bowl rather than a recording of one.

## Modes

The program dial has four positions:

| Position   | Segment | Reps | Total  | Notes |
|------------|---------|------|--------|-------|
| **Off**    | —       | —    | —      | Idle. Play does nothing. |
| **Metta**  | 10:00   | 4    | 40:00  | Metta bhavana: self, friend, neutral, difficult person. |
| **Body scan** | 30:00 | 1    | 30:00  | One continuous sweep. No interior bells. |
| **Custom** | 10:00   | 1    | 10:00  | Free-form starting point. |

### Why body scan is 1 rep

Metta bhavana has four genuinely discrete phases — the bell is an *instruction*,
telling you to change the object of attention. A body scan is one continuous sweep
from feet to head, so interior bells would be arbitrary pacing markers rather than
instructions. The preset therefore runs as a single 30-minute segment with only the
opening and closing bells.

### Presets are starting values, not locks

Selecting a program *loads* a segment time and rep count; it does not freeze them.
The duration and repetition dials stay live in every mode. Spin duration to 12:00
while in Metta and you get 12:00 × 4. This keeps the firmware to a single state model
and avoids the situation where two of the four program positions have dead controls —
which on physical hardware reads as a fault, not a design decision.

## Controls

- **Program** — 4-position rotary selector, labelled around the outside.
- **Duration** — free-spinning encoder. Increments in **30-second** units. Sets the
  **segment** time (the length of one repetition), not the total.
- **Repetitions** — free-spinning encoder. Multiplies segment time into total time.
- **Play** — starts and stops the session.

## Screen

A simple segment display, no backlight. It shows three things:

```
SEGMENT   10:00
REPS          4
TOTAL     40:00
```

While running, the segment field counts down, the reps field shows position
(`2/4`), and total shows time remaining in the whole session.

## Bell pattern

- **Three strikes** to open the session.
- **One strike** at each segment boundary.
- **Three strikes** to close.

A single-segment program (body scan, or custom at 1 rep) therefore has no interior
strikes at all — just the opening and closing threes.

## Repository layout

```
web-prototype/   Browser mock-up of the interface. Working dials, working timers,
                 synthesised bowl sound. This is where the interaction is designed
                 before anything gets soldered.
hardware/        Arduino-based build plans: BOM, wiring, enclosure, firmware notes.
tasks/           Working notes, todo, lessons.
```

## Status

Interface prototype first. The web prototype is the reference implementation of the
interaction model — the firmware should behave identically.
