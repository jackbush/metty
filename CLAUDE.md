# CLAUDE.md

Design notes and implementation detail for Metty. The README is deliberately short and
practice-facing; the reasoning lives here.

## Aesthetic

Braun, after Rams: black ground, white geometry, no gradients and no drop shadows.
Depth is carried by line weight and spacing alone. Helvetica, uppercase, wide tracking
for the few labels that survive — the program positions, and Time and Repeats. Nothing
else is labelled, because nothing else needs to be. The screen is the one light surface
on the device, which is the point: it is the only thing you read.

The physical device reads, from above, a little like a record player. Instead of a
record: a medicine bowl / bell. Instead of a tonearm: a striker that swings in to sound
it. Instead of a pickup and speed controls: dials that program the timer.

## Controls

- **Program** — 4-position rotary selector, labelled around the outside.
- **Time** — free-spinning encoder, 30-second increments. Sets the **segment** time
  (the length of one stage), not the total.
- **Repeats** — free-spinning encoder. Multiplies segment time into total time.
- **Play** — starts and stops the session.
- **Reset** — reloads the current program's preset, stopping any session in progress.
  Exactly as if the program dial had been turned away and back.

Both encoders are the same size and carry the same 15-mark tick ring, landing on real
detent positions rather than being decoration. Their labels sit between them with a
label's height of clear air, so each reads as belonging to the control it touches.

Play and Reset are dead when the program is Off.

### Presets are starting values, not locks

Selecting a program loads a segment time and stage count; it does not freeze them. The
dials stay live in every mode — spin duration to 12:00 in Mettā and you get 12:00 × 5.
This keeps the firmware to a single state model and avoids two of the four program
positions having dead controls, which on physical hardware reads as a fault rather than
a design decision.

## Screen

A reflective segment display, no backlight, no labels. Two rows:

```
  5            40:00     <- top row, 30% height
         8:00            <- bottom row, 60% height
```

**Bottom row (60%)** is the segment time, the only thing always present. It counts down
while running.

**Top row (30%)** carries repeats remaining on the far left, total time remaining on the
right. It appears only when more than one repeat remains — so a single-segment program
never shows it, and during a multi-repeat session it goes dark as the last repeat
begins. The top row exists to answer "how much more after this one?"; on the last repeat
that question has no answer, and a row reading `1` is noise. A lit top row therefore
always means *there is more to come*.

Repeats count **down**, not `2/4`. Mid-sit you want to know what is left, not where you
are in a sequence.

## Bell pattern

- **Three strikes** to open.
- **One strike** at each segment boundary.
- **Three strikes** to close.

A single-segment program (custom at 1 rep) has no interior strikes at all.

## Status and deployment

The web prototype is the reference implementation of the interaction model — the
firmware should behave identically. It is static: no build step, no dependencies.

`.github/workflows/pages.yml` uploads **only** `web-prototype/` as the Pages artifact,
so the prototype sits at the site root and the planning notes stay in the repo without
being deployed. One-time setup: Settings → Pages → Build and deployment → Source:
GitHub Actions. Every push to `main` then redeploys to https://jackbush.github.io/metty/

Asset paths in `index.html` are relative, so the page also works from a subpath or
straight off the local filesystem.
