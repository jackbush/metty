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
- **Time** — free-spinning encoder. Increments in **30-second** units. Sets the
  **segment** time (the length of one repeat), not the total.
- **Repeats** — free-spinning encoder. Multiplies segment time into total time.
- **Play** — starts and stops the session.
- **Reset** — reloads the current program's preset, stopping any session in progress.

### Duration and Repeats

Both are the same size and carry the same 15-mark tick ring, landing on real detent
positions rather than being decoration. Duration sets the segment length in 30-second
steps; Repeats multiplies it. Their labels sit between them with a label's height of
clear air, so each reads as belonging to the control it touches.

## Reset

A second button under Play. It reloads the current program's preset — exactly as if the
program dial had been turned away and back again — and stops the session if one is
running. Both Play and Reset are dead when the program is Off.

## Aesthetic

Braun, after Rams: black ground, white geometry, no gradients and no drop shadows.
Depth is carried by line weight and spacing alone. Helvetica, uppercase, wide tracking
for the few labels that survive — the program positions, and Time and Repeats. Nothing
else is labelled, because nothing else needs to be.

The screen is the one light surface on the device, which is the point: it is the only
thing you read.

## Screen

A reflective segment display, no backlight, no labels. Two rows:

```
  4            40:00     <- top row, 30% height
        10:00            <- bottom row, 60% height
```

**Bottom row (60%)** is the segment time, and it is the only thing on screen that is
always present. It counts down while running.

**Top row (30%)** carries the repeats remaining on the far left and the total time
remaining on the right. It appears only when more than one repeat remains — so a
single-segment program never shows it, and during a multi-repeat session it goes dark
as the last repeat begins.

The reasoning: the top row exists to answer "how much more after this one?". On the
last repeat that question has no answer left, and a row reading `1` is noise. Turning
it off means a lit top row always means *there is more to come*.

Repeats count **down**, not `2/4`. Mid-sit you want to know what is left, not where you
are in a sequence.

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

## Deploying the prototype

The prototype is static — no build step, no dependencies. It is published to GitHub
Pages by `.github/workflows/pages.yml`, which uploads **only** `web-prototype/` as the
site artifact, so the prototype sits at the site root and the planning notes stay in
the repo without being deployed.

One-time repository setup:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

After that, every push to `main` redeploys to https://jackbush.github.io/metty/

Asset paths in `index.html` are relative, so the page also works unmodified from a
subpath or straight off the local filesystem.
