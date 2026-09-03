# Metty — hardware plans

Arduino-based build. This folder holds the electronics, mechanical and firmware
planning. Nothing here is committed to yet; `web-prototype/` is the reference for how
the thing must *behave*, and this describes how to make it behave that way in physical
parts.

Prices below were researched on **3 September 2026** and are marked as verified or
estimated. Read them as a shopping map, not a quotation — re-check before ordering.

## Design constraints

1. **The bell is real.** No speaker, no samples. A struck bowl is the entire point.
2. **No backlight.** A reflective display, readable in daylight, invisible-ish at
   night. A meditation timer that glows in a dark room is a distraction.
3. **The controls are the interface.** No phone, no app, no wifi, no companion
   anything. Everything is reachable with your hands in under three seconds.
4. **Mains only, no battery.** An external certified supply; no mains voltage inside
   the enclosure. Nothing to charge, nothing to go flat mid-sit, nothing that ages.
5. **A wooden enclosure**, which is an acoustic component as much as a case.
6. **The dials never need repositioning.** Both value dials spin endlessly. Selecting
   a program loads new numbers into them, and the knobs must not have to be physically
   moved to match. This rules out potentiometers outright.
7. **It must survive being wrong.** A hung timer in the middle of a 40-minute sit is
   the worst possible failure. Watchdog on, and a hardware power switch.

## Block diagram

```
 [4-pos rotary switch] ──┐                    ┌──> [ reflective dot-matrix LCD ]
 [encoder: time]      ───┤                    │      (SPI, no backlight)
 [encoder: stages]    ───┼──> [    MCU    ] ──┤
 [play button]        ───┘         │          └──> [ MOSFET ] ──> [ solenoid ] ──> [ arm ]
                                   │
                            [ EEPROM / flash ]
                            edited presets

 [external 12V PSU] ──> [DC inlet] ──┬──> [buck 3V3] ──> logic
                                     └──> solenoid rail (bulk cap, separate return)
```

Three changes from the first draft: the **Reset button is gone** — turning the program
dial away and back reloads the preset, which is what Reset did — the MCU now owns
**non-volatile preset storage**, because presets are editable from the front panel, and
the striker drives **a pivoting arm** rather than hitting the bowl directly.

---

## Why the value dials must be encoders, not pots

This is constraint 6, and it is worth being explicit because it is the single decision
that shapes the whole front panel.

A potentiometer's knob position *is* its value. That works only if the value never
changes except by hand. Here it does: selecting Mettā loads 8:00 × 5, selecting
Ānāpānasati loads 5:00 × 4, and holding Play writes whatever is currently dialled back
into the preset. With pots, every one of those events would leave the knob pointing at
a number the device is not using — the classic "parameter jump" problem from analogue
synths, where touching a knob after a patch change snaps the value to the knob's
physical position and destroys the setting.

Incremental encoders have no absolute position, so there is nothing to disagree with.
They spin forever in both directions, the firmware holds the value, and the knob is
purely a rate input. The cost is that the knob can no longer *show* the value — which
is precisely why the display carries both numbers at all times while setting up, and
why the top row is now always lit when idle rather than only during multi-stage
sessions.

Note the pleasing asymmetry this produces, and keep it: **Program has hard stops and
cannot lie; Time and Stages have no stops and never need to.**

**Absolute encoders are the wrong tool**, despite sounding relevant. An absolute
encoder *has* a position, so loading a preset re-introduces exactly the mismatch you
are trying to eliminate.

---

## The display — why it has to be dot matrix

The old plan called for an HT1621 6-digit segment LCD. That part cannot render this
layout, for two independent reasons.

**1. The rows are different heights.** The bottom row is 60% of the display height and
the top row 30%. Off-the-shelf segment glass has one digit height per field, fixed at
the factory.

**2. The fields overflow six digits.** Total time is `MM:SS` with an uncapped minutes
field, so it grows past four characters at 100 minutes:

| Setting | Total shown | Top-row glyphs |
|---|---|---:|
| 8:00 × 5 (Mettā) | `40:00` | 6 |
| 45:00 × 4 | `180:00` | 7 |
| 99:00 × 99 (worst case) | `9801:00` | 9 |

`45:00 × 4` is an ordinary long sit, not a pathological input. Six digits was never
going to be enough, and the answer to the old open question is a flat no.

### The prototype is already the right polarity

Worth stating, because it is easy to assume otherwise: every reflective, non-backlit
technology is **dark ink on a light ground**. The prototype already models exactly
that — `--lcd: #d7d8d0` with `--lcd-ink: #0d0f0c` — so the hardware will match the
screen you have been looking at, not invert it. The black-ground rule in the project's
aesthetic notes governs the *deck*; the display is deliberately the one light surface,
and reflective LCD is how it stays light without emitting anything.

The prototype also draws **unlit ghost segments at 7% opacity**, the way real segment
glass shows its unpowered ITO. That has to be recreated deliberately on a dot matrix,
and it is a real selection criterion: either 4-level greyscale (DOGXL160 / DOGXL240) or
a 50% dither at a pitch fine enough that the checkerboard reads as grey rather than as
texture.

### Candidates

| Part | Res. | Active area | Pitch | Interface | Price (1 off) | Vendor |
|---|---|---|---|---|---|---|
| **Sharp LS027B7DH01** | 400×240 | 58.8 × 35.3 mm | 0.147 mm | 3-wire SPI | **£23.73** ✅ | Digi-Key UK (425-2907-ND) |
| Same, on Adafruit 4694 breakout | 400×240 | as above | as above | SPI, rails handled | **£36.50** ✅ | Pimoroni |
| **EA DOGXL160W-7** | 160×104 | 72 × 45.6 mm | ~0.42 mm | SPI + I²C, UC1610 | **£32.28** ✅ | Digi-Key UK |
| EA DOGXL240N-7 | 240×128 | 90 × 46.7 mm | ~0.37 mm | SPI + I²C, UC1611s | £30.23 | MMS Electronics |
| EA DOGL128W-6 | 128×64 | 64 × 35.5 mm | ~0.5 mm | SPI, ST7565 | £18.82 ✅ | Digi-Key UK |

All are supported by **u8g2**, which is the library to use.

The discriminator is dot pitch, and it is stark: 0.147 mm versus ~0.42 mm. Height
available for the big bottom-row digits is roughly 144 px on the Sharp against ~50 px
on the DOGXL160. At reading distance behind a wooden fascia that is the difference
between a rendered typeface with clean curves and an obviously bitmapped digit. Since
the whole point of this object is that the screen is the one thing you read, that
difference is the decision.

At the Sharp's pitch a 50% dither for the ghost segments is invisible as a pattern; at
the DOG series' ~0.4 mm it would read as dots, which is why those parts want their
hardware greyscale.

### Recommendation

**Sharp LS027B7DH01.** Its 58.8 mm active width also lands neatly in the fascia
envelope. Buy the **Adafruit 4694 breakout (£36.50, Pimoroni)** to prototype with,
because it handles the fine-pitch FPC tail, the 5 V rail and level shifting for you.
Move to the bare panel at £23.73 only if you go to a custom PCB.

Budget permitting, add an **EA DOGXL160W-7 (£32.28)** to the first order and look at
them side by side — silvery metallic grey against paper-white FSTN is a taste call no
datasheet settles, and £32 to avoid building the wrong one into a wooden box is cheap.

### Gotchas, both build-stoppers

- **The Sharp needs VCOM inversion, and it is not optional.** Without an alternating
  VCOM signal the liquid crystal accumulates a DC bias, causing stuck pixels and
  shortening panel life. Drive it by the software command bit or by toggling the
  `EXTCOMIN` pin; the interval must never exceed one second. The robust implementation
  is a hardware timer on `EXTCOMIN` — set it and forget it.
- **RAM.** Adafruit's page says the panel can't be used with an ATmega328 because the
  full 13.5 KB frame must be buffered. That is true of *their* library, not of u8g2,
  whose `_1_`/`_2_` page-buffer constructors hold only a 400-byte strip. An AVR is
  viable — but redrawing 240 lines over software SPI once a second on a 16 MHz part is
  slow. **This is a concrete argument for the Pico 2**, which holds the whole 12 KB
  frame in RAM without noticing.
- The bare panel terminates in a fine-pitch FPC tail needing a matching ZIF connector.
  **The exact pin count and pitch is unverified — read it off Sharp's datasheet before
  laying out any board.**
- **If you choose a DOG part instead**, its charge-pump booster capacitors must match
  the supply voltage and interface, and the arrangement differs between 3.3 V and 5 V.
  Getting this wrong is the usual cause of a blank or washed-out DOG display. Take the
  application schematic from the official datasheet, not a forum.

### Ruled out, with reasons

**E-paper — definitively out**, for a worse reason than looks. Panels without partial
refresh want a minimum 180-second refresh interval; you need one second. Panels *with*
partial refresh cannot run in partial mode indefinitely — the manufacturers' own
documentation says accumulated ghosting is not repairable, and requires a full refresh
(a 1–3 second black/white flash) every 5–10 updates. A 30-minute sit is 1,800 updates.
A display that flashes every few seconds during meditation is the worst failure mode
available.

**Custom segment glass — right answer, wrong project stage.** Tooling runs **$600–
$4,500** NRE with a typical MOQ of **1,000 units**. For a one-off that is £500–£1,500
before you own anything, and the layout is frozen forever. But if Metty ever becomes a
product, bespoke segment glass is *exactly* the Braun answer and would beat any dot
matrix. Worth keeping in the back of the mind.

---

## The controls

This is where the budget buys the most perceived quality, and it is the half of the
build that cannot be fixed in firmware.

### Program selector — use a real switch

| | Real 4-position switch | Detented encoder + software stop |
|---|---|---|
| Position after power loss | Always correct | Lost; must persist and hope |
| Position after a crash or reflash | Correct | Wrong until re-synced |
| Pointer vs. actual mode | Identical by construction | Can silently diverge |
| End of travel | Hard mechanical stop | **Keeps clicking past the stop** |

The last row decides it. An encoder that the firmware refuses to advance still
*clicks*, and a control that clicks while doing nothing is the single most "cheap
appliance" sensation there is.

| Part | Spec | Vendor | Price |
|---|---|---|---|
| **Elma Type 04** (04-1124) | 1 pole × 12 pos, 30°, configurable end stop, gold contacts, 25k cycles | Don-Audio | ~£55 ex-VAT ✅ — **lead time, not on the shelf** |
| **Elma Type 01** (01-1184) | 1 pole × 12 pos, 30°, smaller body | Don-Audio | **£33.51** ✅, **293 in stock** |
| Grayhill 71BD30-01-1-AJN | 1 deck × 12, adjustable stop, MIL-qualified, ¼″ shaft | Mouser / Digi-Key | ~£25–40 ⚠️ |
| Lorlin CK1024 | 1 pole × 12, adjustable stop washer, 6 mm | Farnell 1123687 | ~£3–5 ⚠️ |

Elma's own catalogue is quote-only and publishes no prices; buy through a dealer.
The Type 04 datasheet confirms `04` = four positions in the ordering code, so it can be
ordered factory-stopped rather than shimmed — but **the full ordering code (torque,
shaft length, seal, termination) still needs building with the dealer.**

**Recommendation: Elma Type 01 at £33.51**, in stock now, and comfortably better than
anything non-Swiss. Step up to the Type 04 if you will wait for it. Buy a Lorlin
CK1024 for £4 as a breadboard stand-in either way.

### The two endless encoders

**The specification detail that matters most: match detents to pulses 1:1.** You want
24 detents / 24 PPR — one full quadrature cycle per click. The very common **Alps
EC11E15244G1 is 30 detents but only 15 PPR**, so half your clicks do nothing. Check the
ratio on any encoder you order, from any maker.

| Part | Detents / PPR | Bushing | Life | Price |
|---|---|---|---|---|
| **Bourns PEC11R-4220F-N0024** | **24 / 24** ✅ | **Metal threaded**, 6 mm D shaft, 20 mm | 30k | ~£3 ⚠️ |
| Bourns EM14A0D-C24-L032S | 32 / 32 ✅, **optical** | Panel bushing + lockwasher | **100k** | ~£15–22 ⚠️ |
| Alps EC11E15244G1 | 30 / **15** ✗ | Metal, 20 mm | 15k | ~£3–4 ⚠️ |
| Elma E27 | 30, 1.5 N·cm, sealed metal | M7×0.75 | 1M rev | POA, ~40 day lead |

The metal threaded bushing is the whole argument for the Bourns over a generic EC11 —
plastic-bushing encoders feel loose in a panel no matter how hard you tighten the nut.
The 20 mm shaft is what you want through a thick wooden fascia.

**Recommendation: two × Bourns PEC11R-4220F-N0024**, ~£6 the pair. If you want the
encoders to feel like they belong to the Elma switch, the **EM14 optical** at ~£18 each
is a real step up in detent quality — and being optical, it has no contact bounce at
all, which removes the debouncing question entirely.

### Play button

Held for 3 s as a secondary gesture, so you want a long-travel, positive action rather
than a sharp microswitch click. **No LED ring** — the product must not glow.

| Part | Spec | Vendor | Price |
|---|---|---|---|
| **APEM AV0630C940** | 16 mm, SPST-NO, flat, IP65, stainless | Blue Sky Components | £18.80 inc VAT ✅ |
| APEM AV1630C900 | 16.2 mm, domed actuator | Farnell 1086624 | ~£8–12 ⚠️ |
| Schurter MSM CS 16 | 16 mm, **ceramic actuator**, IP67 | Mouser / Digi-Key | ~£15–25 ⚠️ |
| Adafruit 16 mm metal momentary | 16 mm, no LED | The Pi Hut | **£1.50** ✅ |

The Schurter ceramic-faced parts are the nicest thing to touch in this category — cool,
dense, scratch-proof — but check you are buying the non-illuminated variant, as most
MSM CS listings are LED versions. The £1.50 Adafruit part is a good prototype and
honestly not embarrassing in the final build.

### Knobs

**Collet fixing beats a set screw**: it grips the whole shaft circumference,
self-centres, and cannot leave the pointer a degree or two off. Note the trade-off —
Elma's Classic Collet line is collet-fixed moulded plastic; Elma's K1 aluminium line is
set-screw.

| Knob | Ø | Material | Fixing | Price | In stock |
|---|---|---|---|---|---|
| **Elma K1 Dimple** (K1-DM-B64) | **39 mm** | Anodised aluminium, black | Set screw, 6 mm D | **£7.88** ✅ | 96 |
| **Elma K1 Pure** (K1-PR-B64) | **19 mm** | as above | Set screw, 6 mm D | **£6.94** ✅ | yes |
| Elma Classic Collet 36 mm | 36 mm | Matt grey, white line | **Collet** ✅ | ~€4.86 ✅ | yes |
| Elma Classic Collet 21 mm | 21 mm | as above | **Collet** ✅ | ~€2.93 ✅ | yes |
| Anodised aluminium, 20 mm | 20 mm | Aluminium, silver | Set screw | £2.90 ✅ | The Pi Hut |

All Elma prices are Don-Audio, GBP, inc. German VAT.

**Recommendation: Elma K1 Dimple 39 mm + two K1 Pure 19 mm, £21.76 the set.** One
family, one finish, one material, two sizes — which is exactly the Rams move, and the
39 mm matches the record-player-platter scale the design notes describe. Order the
PEC11R in the **D-shaft (F)** version to suit K1's set screw.

If you prefer collet fixing and the grey-with-white-line lab look, the Classic Collet
36 mm + 2 × 21 mm is about €11 the set — but order **round-shaft** encoders, as collets
want a round shaft.

⚠️ Electrogruppen and Ritel could not be reached and may be defunct.

### MCU

Requirements: ~15 GPIO, an SPI display with a 12 KB frame, two quadrature encoders, and
non-volatile storage for edited presets.

| Board | Interrupts | Preset storage | Price | Verdict |
|---|---|---|---|---|
| **Raspberry Pi Pico 2** | Every GPIO, **plus 12 PIO state machines** | ❌ Flash-emulated (`EEPROM.h` shim or LittleFS) | **£4.80** ✅ | **Best fit.** 520 KB RAM holds the Sharp's full frame; PIO decodes both encoders in hardware |
| **Arduino Nano Every** | All pins (ATmega4809) | ✅ **Real 256 B EEPROM** | £13.40 ✅ | Best if real EEPROM is a hard requirement. 6 KB SRAM forces page-mode on the display |
| Arduino Nano ESP32 | All GPIO | ❌ NVS in flash | £18.40 ✅ | Wi-Fi/BLE is a liability for this product concept, not a feature |
| Teensy 4.0 | All pins | ⚠️ 1,080 B emulated, transparently | £22.90 ✅ | Absurd overkill, flawless I/O |
| Adafruit Feather/Metro M4 | EXTINT **channels are shared** | ❌ QSPI flash | £22.10–26.40 ✅ | Shared-EXTINT is a real trap with six interrupt sources |
| Bare ATmega4809 / 328P | All pins (PCINT on 328P) | ✅ Real EEPROM | ~£2–3 ⚠️ | The right answer for rev 2 |

**Recommendation: Raspberry Pi Pico 2, £4.80.** It is simultaneously the cheapest option
and the one that makes both hard problems disappear — the display frame fits in RAM,
and PIO decodes the encoders without touching the CPU. The flash-emulated EEPROM is the
one wart, and with presets written only on a deliberate gesture it is a non-issue.

For rev 2, move to a **bare ATmega4809 or RP2350 on your own board**. A dev board with a
USB micro connector and a power LED inside a Rams-idiom wooden enclosure is a small
betrayal.

⚠️ **Every board listed has a power LED**, and most have a user LED too. Plan to
desolder them or black them out — constraint 2 is not negotiable.

---

## The striker

### The bowl must be decoupled

A bowl clamped or glued to the plinth will not ring — it will thud. The mounting has to
touch as little of the bowl as possible and damp as little as possible.

The traditional answer is right and should not be improved on: a **rubber O-ring
cushion**, sized so the bowl sits on the ring's inner upper curve, contacting a circle
roughly a third of the way up from the base. Silicone (Shore 40–50A) rings better;
nitrile lasts longer. Buy three sizes around 70–90 mm ID, 5–6 mm cord, and choose by
ear.

The tidier alternative is **three 3M Bumpon SJ5303 silicone hemispheres** (£0.08 each,
Digi-Key) in a shallow recess: minimal contact, invisible, and the bowl lifts straight
off.

Either way, **the plinth surface under the bowl should itself be decoupled from the
box**, or the bowl drives the wooden panel and the decay shortens audibly.

**Prototype this before anything else.** If the bowl doesn't sustain, the whole project
is pointless, and it is cheap to find out early.

### The mallet must be in free flight

This is the most important mechanical decision in the build.

**The failure that ruins bell strikers: the coil is still energised when the mallet
touches the rim, so the solenoid holds the mallet against the bowl and mutes it.** The
note dies in under a second and sounds like a fault. Bolting a mallet to a plunger
walks straight into this.

Two ways out, and the second is better:

1. **Overtravel.** Arrange the geometry so the plunger reaches its own end-stop
   *before* the mallet reaches the rim, crossing the last millimetres in free flight.
2. **A pivoting arm the plunger merely kicks — recommended.** The solenoid strikes a
   lever near its pivot; the arm carries its own inertia to the rim and rebounds. The
   plunger stops at its own end-stop and never touches the bowl through any load path.
   This also gives a *mechanical* gain you choose: a 5–8 mm plunger kick at 20 mm
   radius on a 60–80 mm arm produces a fast tip from a small, low-current solenoid. And
   the only impulse path into the wood is the pivot, which you can bush in rubber.

Strike **the rim** — the rim gives the fullest tone; the belly or base sounds dead. The
tip must be soft: felt, leather, or a suede-wrapped hardwood core.

### Strike energy is pulse width, and the range is small

Strike energy comes from the plunger's kinetic energy at impact, not from the rated
*holding* force — which is specified at zero air gap and is nearly useless as a
selection number.

The Logos Foundation's work on musical solenoid strikers puts the practical control
range at roughly **250 µs to 25 ms**, with about a decade of usable dynamics. Past that
you hit magnetic saturation and a longer pulse gives no audibly stronger stroke. The old
note's "start around 15–30 ms" is therefore at the top of the range — expect 20 ms to be
already saturated and the real fine control to live around **4–15 ms**.

**Do not PWM-chop the coil to control level.** It makes the solenoid audibly buzz and
radiates broadband interference. Use single fixed-voltage pulses of varying width.

One happy consequence: at five strikes per session the duty cycle is about **0.007%**.
A coil rated 3.9 V continuous is rated ~12.2 V at 10% duty, and you are three orders of
magnitude below that — so you can heavily overdrive a low-resistance coil and get punch
without a large solenoid.

### Solenoid options

| Part | Coil | Stroke | Price | Notes |
|---|---|---|---|---|
| **Ledex 195205-230** | 12 V, 20.7 Ω, 0.58 A, **100% duty** | 12.7 mm | **£32.69** ✅ | The gentle choice, trivial to power. Good with a lever arm |
| Ledex 195205-227 | 12 V, 5.27 Ω, 2.3 A | 12.7 mm | £32.41 ✅ | Electrically the sweet spot — **0 in stock**, lead time |
| Ledex 195207-225 | 12 V, 2.13 Ω, ~5.6 A peak | 17.8 mm | £32.30 ✅ | The punchy choice. Needs real bulk capacitance and the bigger PSU |
| **Adafruit 412** (JF-0530B class) | 12 V, 40 Ω, ~300 mA | 5.5 mm | **£5.52** ✅ | Starting force only ~0.5 N — genuinely weak, marginal on a heavy 15 cm bowl. **Buy one as a £5 sacrificial prototype** to find your geometry |

The £5 generic parts have plain steel plungers, no bobbin bearing and loose tolerances:
they clack louder, wear, and drift over thousands of hits. The Ledex STA parts cost 6×
and bring a nylon low-friction bobbin, a 25-million-actuation rating, and a published
force-vs-stroke curve so you can *design* the strike rather than discover it.

⚠️ Kuhnke, Magnet-Schultz, Mecalectro and Takaha are all appropriate and none are
practically buyable in ones in the UK. Don't plan around them.
⚠️ The Ledex coil resistances come from the Size 75 STA datasheet for the 195204 base
part. The 195205/195207 variants near-certainly share it — **confirm before committing
to a coil current.**

### Actuator alternatives, honestly

| Approach | Strike quality | Verdict |
|---|---|---|
| Direct solenoid, mallet on plunger | Poor unless overtravel is designed in | Muting risk is real |
| **Solenoid + pivoting arm** | **Best of the practical options** | **This is the design** |
| Hobby servo, direct strike | ~10× too slow to build tip speed, and it *holds*, damping the bowl | Reject |
| Servo as a cocking/escapement | Very good — release angle maps almost linearly to energy | Lovely, and a lot of work |
| Stepper arm | Cogs and buzzes; holding torque damps | Not worth it |
| BLDC / voice coil | The research answer — widest, most consistent dynamics | Overkill for five strikes a session |

### The clack, and what actually fixes it

The plunger's clack is **structure-borne**: the plunger slams its end-stop, the frame
recoils, and the frame is bolted to a large flat wooden panel that is an excellent
loudspeaker diaphragm. A wooden box amplifies it. In order of effectiveness:

1. **Never bolt the solenoid rigidly to a large panel.** Mount it to a small stiff
   sub-bracket, then isolate that bracket from the wood with rubber bushes.
2. **Damp the end-stop** with a thin elastomer pad, O-ring or felt washer on the pole
   face. Standard practice in quiet-solenoid patents — player-piano solenoids exist
   precisely to solve this problem.
3. **Add mass** to the isolated bracket, lowering the frame's recoil velocity.
4. **Kill the return clack too.** With a clamped flyback the plunger returns fast and
   clacks on the way home as well. Most builders forget this one.
5. **The lever design helps by itself** — the only impulse path to the wood is the pivot.
6. **Don't** damp the bowl. Foam at the strike point does reduce the clack, and it also
   destroys the thing you are making.

The assembly that works: solenoid → small stiff steel or aluminium sub-bracket → four
rubber bushes (ebm-papst **LZ550**, £0.61 each, or Mechatronics **VI-1**, £0.18) →
wooden plinth, bolts *just* nipped up so the rubber is compressed but not crushed.
Nylon shoulder washers above and below keep the bracket floating.

### Future: the record-player motion

v1 keeps the arm static. If the arm should *swing* in like a tonearm, add a servo at the
pivot — but note this is pure theatre, and theatre that costs a moving part that can
fail mid-session. Ship v1 static.

---

## Drive electronics

### MOSFET

**The constraint everyone gets wrong:** BV<sub>DSS</sub> must exceed rail + clamp
voltage. If you clamp the flyback at ~29 V above ground on a 12 V rail, V<sub>DS</sub>
peaks near 41 V and a 30 V FET dies.

| Part | Rating | Price | Notes |
|---|---|---|---|
| **IRLZ44NPBF** | 55 V, 47 A, 22 mΩ @ 5 V gate | **£1.32** ✅ | **Still the right answer.** Genuinely logic-level, and 55 V leaves comfortable margin |
| IRLB3813PBF | **30 V**, 260 A, 3 mΩ | £2.07 ✅ | The "modern better" part on paper — **30 V is too low once you clamp.** A good example of why the newest part isn't the right part |

At 5.6 A worst case the IRLZ44N dissipates ~0.7 W for 20 ms. No heatsink needed.

### Gate network

| Part | Value | Why |
|---|---|---|
| Series resistor | **100 Ω** | Limits peak current into C<sub>iss</sub>. Gives a ~0.3 µs edge, which is fine — you switch twice per strike, not at 100 kHz, and slow edges radiate less. Do not use 10 Ω |
| Pull-down | **10 kΩ** | Holds the gate off during MCU reset and boot. **Non-optional** — a floating gate at power-up fires the striker |

### Flyback: this choice decides whether the strike is crisp

When you switch off, the coil's current must keep flowing, and the clamp voltage sets
the rate: **dI/dt = V<sub>clamp</sub> / L**.

- **Plain 1N4007 across the coil** lets the coil see only ~0.7 V of reverse EMF, so
  current decays over milliseconds. The plunger stays magnetically held well past the
  end of your pulse — the mallet lingers against the rim, damping the fundamental, and
  back-to-back strikes become inconsistent. Cheap, safe for the FET, **wrong for the
  sound**.
- **A TVS clamp** lets the drain fly to ~30–40 V and current collapses roughly 40×
  faster — sub-millisecond. The plunger releases the instant you drop the gate.

| Option | Part | Price | Notes |
|---|---|---|---|
| Slow — don't use | 1N4007 | ~£0.10 | Baseline for comparison |
| Fast diode, still slow release | UF4007-E3/54 | £0.63 ✅ | Removes the recovery spike but not the current tail |
| **Recommended** | **SMBJ18A** or SMBJ24A TVS | **~£0.35–0.45** ✅ | Across the coil, cathode to drain. Clamps ~29 V above rail; V<sub>DS</sub> peak ~41 V, inside the IRLZ44N's 55 V |
| Belt and braces | UF4007 + 24 V 5 W zener | ~£0.90 | The classic pinball/organ arrangement |

**Do not fit both a plain diode and a TVS in parallel** — the diode wins at 0.7 V and
you get the slow behaviour plus an extra part.

### Bulk capacitance

Sizing from ΔV = I·t / C:

- **195207-225 (2.13 Ω):** ~3.5 A average for 25 ms is 88 mC; a 2 A supply contributes
  50 mC, so the cap supplies ~38 mC. For 3 V droop, **C ≈ 13,000 µF** → fit 3 × 4700 µF.
- **195205-230 (20.7 Ω):** ~15 mC, which the supply covers. **1 × 4700 µF** is plenty,
  and is really there to keep the logic rail clean.

Use **Chemi-Con EKYB250ELL472MM25S**, 4700 µF 25 V, £1.71 ✅ — 10,000 h at 105 °C. In a
sealed wooden box that runs for years, the 2,000 h parts are false economy for 29p. Add
a **100 nF X7R** directly across the FET and another at the coil terminals.

---

## Power

**Your instinct is right and it is not a compromise:** an external certified PSU makes
the wooden enclosure a **SELV** box. No mains creepage distances, no earthing of a
non-conductive enclosure, no fire-rated barriers, no mains wiring near a resonating
wooden panel. A self-built mains supply inside combustible material is the one
genuinely dangerous idea available here.

| Part | Output | Price | Notes |
|---|---|---|---|
| **Mean Well GST25B12-P1J** | 12 V, 25 W | **£10.52** ✅ | Class II desktop brick, CE/UKCA, EN 62368-1. Takes a separate **IEC C13 lead** (~£4) |
| **Mean Well GSM40B12-P1J** | 12 V, 40 W | **£15.97** ✅ | **Choose this if you use the 195207-225** — its 5.6 A peaks want the headroom |

⚠️ A UK-moulded-plug wall-wart variant could not be confirmed. The desktop-brick-plus-
IEC-lead route is verified, and for a Braun-ish object a plain black brick with a proper
detachable lead reads better than a wall-wart anyway.

| DC inlet | Price | Notes |
|---|---|---|
| Same Sky PJ-102AH | £0.57 ✅ | Fine; feels like nothing |
| **Switchcraft L722A** | **£4.89** ✅ | Panel-mount, solder eyelets, integral switch contact. Machined feel — the right level here |
| Neutrik NC4MD-L-1 | £5.92 ✅ | 4-pin XLR, **latching**. Two pins per rail for headroom and a genuinely premium click. Needs an NC4FX cable plug and re-terminating the PSU lead — a low-voltage joint only, so still safe |

| Logic rail | Output | Price |
|---|---|---|
| **RECOM R-78E3.3-1.0** | 3.3 V 1 A, 8–28 V in | **£3.32** ✅ |
| RECOM R-78E5.0-1.0 | 5 V 1 A | £3.32 ✅ |
| Traco TSR 1-2450 | 5 V 1 A | £4.62 ✅ |

These are drop-in 7805 pinouts at 80–95% efficiency. A 7805 dropping 12→5 V at 200 mA
burns 1.4 W inside a sealed wooden box; these burn ~0.1 W. **Take the logic rail from
before the solenoid's bulk capacitor bank** (or via a ferrite), and give the regulator
its own 220 µF local reservoir, so the solenoid's rail droop cannot brown out the MCU.

### Protection

| Function | Part | Price | Notes |
|---|---|---|---|
| Fuse holder | Schurter **0031.8201** | £1.06 ✅ | PCB-mount 5 × 20 mm |
| Fuse | **T2A slow-blow** (T3.15A for the 40 W PSU) | ~£0.40 | **Must be slow-blow** — inrush into 14,000 µF and a 5.6 A pulse will nuisance-trip a fast fuse |
| Reverse polarity, preferred | **IRF9540NPBF** P-channel | £2.02 ✅ | High-side P-FET, ~120 mΩ. Near-zero drop at idle, unlike a diode |
| Reverse polarity, simple | 1N5822-E3/54 Schottky | £0.67 ✅ | Costs ~0.5 V permanently. **Do not use in the solenoid path** with the high-current coil |

### UK regulatory position — informational, not legal advice

For a **one-off device you build for your own use and do not sell, give away, or
otherwise place on the market**, UKCA/CE marking obligations do not bite: equipment for
a manufacturer's own use is not "placed on the market", so the conformity-assessment and
marking duties under the Electrical Equipment (Safety) Regulations 2016 and the EMC
Regulations 2016 do not apply. General product-safety and electrical-safety duties still
exist in the background.

Using a certified external PSU is what makes this easy — the mains-connected part is an
appliance someone else has already tested, and everything you build sits at 12 V SELV.
If you ever did want to give one to a friend, that architecture is also the one that
makes compliance tractable.

---

## Input strategy — and why "pin pressure" was the wrong question

The old version of this document called the encoder wiring "the main open decision" and
framed it as a shortage of interrupt pins. That framing had a factual error in it and
has since been overtaken by the behaviour changes, so it is worth walking through
properly rather than just editing the conclusion.

### The error in the original premise

The old note read: *"An ATmega328 Nano has only two external-interrupt pins (D2, D3),
and two quadrature encoders want four"* — and then recommended staying on the **Nano
Every**. Those are two different chips. The classic Nano is an ATmega328P and does have
only `INT0`/`INT1`. The Nano Every is an **ATmega4809**, and on the 4809 *every* GPIO is
interrupt-capable. The constraint that motivated the whole section does not exist on the
board the section recommends. (And even on a 328P, pin-change interrupts cover all 23
pins.)

### Counting the pins for real

| Function | Pins |
|---|---:|
| Time encoder A/B | 2 |
| Stages encoder A/B | 2 |
| Program selector, one per position, `INPUT_PULLUP` | 4 |
| Play button | 1 |
| Display SPI (SCK, MOSI, CS) | 3 |
| Display control (`EXTCOMIN`, `DISP`) | 2 |
| Solenoid gate | 1 |
| **Total** | **15** |

A Nano Every exposes 22 I/O; a Pico 2 exposes 26. There is no pin shortage. Which means
the old trick of feeding the program switch through a resistor ladder into one ADC pin
can be dropped — it costs threshold tuning, ADC noise, and a failure mode where a dirty
contact reads as a *different program*. **Use four discrete pins.**

The program switch is break-before-make, so there is a real moment mid-turn when all
four inputs read open. Firmware must treat "no position" as *hold the last valid
position*, not as an error, or the display flickers through Off as you turn past it.

### The actual question: polling vs. edge interrupts

With interrupts freely available on either candidate board, the choice is no longer
forced by hardware. It comes down to which decoder is more robust — and there polling
genuinely wins rather than merely being adequate.

**Contact bounce is the whole argument.** An EC11-class mechanical encoder bounces for
roughly 1–5 ms per transition. An edge-interrupt design sees every bounce as an edge, so
it must debounce inside the ISR — which means either a delay (unacceptable) or a per-pin
timestamp-and-ignore-window state machine, exactly the code that works on the bench and
produces one phantom step an hour in the field.

A polled **state-table decoder** (the Buxton/Gray-code approach) is immune by
construction. It holds the last valid two-bit state and advances only on a transition
legal in the quadrature sequence. A bounce produces an illegal or repeated transition
and is discarded, with no timing code at all.

**Is 1 kHz fast enough?** Arithmetic, not vibes. 24 detents per revolution, one full
quadrature cycle — four state transitions — per detent:

| Hand speed | Transitions/s | Gap | Samples at 1 kHz |
|---|---:|---:|---:|
| Deliberate (1 rev/s) | 96 | 10.4 ms | 10 |
| Brisk (3 rev/s) | 288 | 3.5 ms | 3.5 |
| Violent flick (10 rev/s) | 960 | 1.04 ms | 1 |

1 kHz holds to a brisk spin with margin and becomes marginal only at a speed you cannot
sustain against a detent spring. **Poll at 2 kHz** and even the violent case gets two
samples per transition. The cost is trivial: a two-encoder state-table poll is ~80 AVR
cycles, so 2 kHz on a 16 MHz part is ~160,000 of 16,000,000 cycles — **about 1% of the
CPU**.

### Put the poll in a timer ISR, not in `loop()`

This is the part the behaviour changes actually bear on. Three things in this design
block for a long time:

1. **A full display refresh** — 400×240 is 12,000 bytes; at 2 MHz SPI that is ~48 ms.
2. **The preset write** — AVR EEPROM stalls the core ~3.3 ms per byte; nine bytes is
   ~30 ms.
3. **Any lazily-written strike routine** that pulses the solenoid with `delay(25)`.

If the poll lives in `loop()`, every one of those is a window where the knobs are dead
and counts are silently lost. In a timer ISR, all three are preempted. **You spend 1% of
the CPU precisely so the other 99% is allowed to be slow and simple.**

### How the new behaviour interacts

**The Reset button is gone.** Its job now belongs to the program dial alone: turn away
and back. One less input to debounce, one less hole in the fascia, one less way to stop
a session by accident. Firmware must reload the preset on *every observed change* of
switch position, including a change back to where it started.

**Play now carries a second gesture — hold 3 s to store the dials into the selected
program.** Two consequences:

- The hold must be *measured*, never *waited on*. Timestamp the press and compare in
  `loop()`. The naive `while (digitalRead(PLAY) == LOW)` spin would freeze the display
  mid-count.
- The release that ends a successful hold must be **swallowed**, or saving a preset also
  starts a session. The web prototype does this with a `heldFired` latch the click
  handler consumes; the firmware needs the identical latch on the button release.

**Presets are now writable, so there is non-volatile state.** The gesture is legal *only
while idle* — not running, not in the pre-roll — which is what makes the 30 ms EEPROM
stall harmless: it is structurally impossible for it to land during a session or delay a
strike. That is behaviour and firmware co-designing, and worth preserving deliberately
rather than by luck. Use `EEPROM.update` so unchanged bytes cost nothing, and write only
the program that changed (3 bytes, ~10 ms).

Store a magic byte and a schema version ahead of the preset block. On boot, if either
fails to match, ignore the block and fall back to the factory table — the exact
behaviour the prototype gets from wrapping its `localStorage` read in a `try/catch`,
verified there against deliberately corrupted storage. AVR EEPROM is good for ~100,000
writes per cell, which at a hand-driven gesture is effectively unlimited.

### Where this lands once the board is chosen

The analysis above is what you need on an AVR, and it stands. But the display choice
changes the board choice, and the board choice changes this question again:

- **On a Pico 2** — which the Sharp display's 12 KB frame argues for anyway — the
  **PIO** peripheral decodes quadrature in hardware, on dedicated state machines, with
  zero CPU involvement and no sampling question at all. Polling becomes moot rather than
  merely adequate. This is the recommended path.
- **On a Nano Every**, poll both encoders with a state-table decoder in a 2 kHz timer
  ISR, as above.
- **With optical encoders** (Bourns EM14), there is no contact bounce to decode around
  in the first place, and either strategy works cleanly.

**In every case: four discrete pins for the program switch, and everything else in
`loop()`.** The conclusion the old document reached was right; the reason it gave was
not.

### One thing none of this solves

`STEP` is now one minute per detent, and the range runs to 99:00. Going from 1:00 to
99:00 is 98 detents — **about four full revolutions** of a 24-detent encoder. Every
decoding strategy tracks that perfectly; it is the *ergonomics* that are in question.

The usual fix is velocity-sensitive acceleration: spin fast and each detent is worth
five minutes. But that breaks exact parity with the web prototype, which is the stated
specification, and it makes the control non-deterministic in the hand — the same gesture
means different things depending on how fast you did it, which is a very un-Braun
property. Recorded as an open question rather than decided. The honest test is whether
anyone ever actually sets 99:00, or whether the real range in use is 5:00–45:00, which
is at most two revolutions.

## Timekeeping

A crystal-based MCU drifts roughly ±50 ppm — about ±0.12 s across a 40-minute sit, which
is irrelevant here. **No RTC needed.** Do not use `delay()` for session timing; run
everything from a single `millis()` epoch captured at start, exactly as the web
prototype computes from `startedAt`. Deriving current stage and remaining time from one
epoch, rather than accumulating per-segment, means drift cannot compound across stages.

---

## Firmware behaviour

`web-prototype/app.js` is the specification. Where this section and that file disagree,
the file is right. Values below were read out of it, not remembered.

### Programs

| Position | Segment | Stages | Total |
|---|---|---|---|
| Off | — | — | — |
| Mettā Bhāvanā | 8:00 | 5 | 40:00 |
| Ānāpānasati | 5:00 | 4 | 20:00 |
| Custom | 10:00 | 1 | 10:00 |

### Ranges

- Segment time: 1:00 … 99:00, in **60-second** steps — one detent, one minute.
- Stages: 1 … 99.
- Selecting a program **loads** these values; it does not lock them. Both encoders stay
  live in every position except Off.

### Session

- Play starts a **5-second pre-roll**: unlit ghost digits with only the final digit lit,
  counting 5 → 1. The session starts on zero.
- Pressing Play during the pre-roll cancels it silently.
- All timing derives from **one `millis()` epoch** captured at the start.
- Bell: **three strikes to open, one at each stage boundary, three to close.** Spacing
  within a triple is 1.7 s.
- A single-stage program therefore has no interior strikes at all.
- Stopping early is **silent** — no closing bell on a manual stop.

### Display

Two rows, no labels, no backlight.

- **Bottom row (60% height)** — segment time, always present. Counts down while running.
  With the deck Off it shows unlit ghost digits only.
- **Top row (30% height)** — stages remaining on the far left, total time remaining on
  the right:
  - **Idle**: always shown, including for a single-stage program. The dials are being
    read back; what you are committing to is *this long, this many times*. Custom at one
    stage reads `1  10:00 / 10:00`.
  - **Running**: shown only while more than one stage remains. It goes dark as the last
    stage begins, and a single-stage session never shows it. During a session a lit top
    row therefore always means *there is more to come*.
  - **Off**: hidden.
- Stages count **down**, not `2/4`.

### Editable presets

- Select a program, move the dials, **hold Play for 3 seconds**. The display inverts
  twice (~0.5 s per beat) and the values are written to non-volatile storage.
- The gesture is legal **only while idle**, and is dead when the program is Off.
- The button release that ends a successful hold is **swallowed**.
- Saved values become that position's preset: turning the dial away and back reloads the
  saved values, not the factory ones.
- Storage carries a magic byte and a schema version; a mismatch falls back to the
  factory table.

---

## Bill of materials, part 1 — electronics

Legend: ✅ price verified from the vendor's page on 3 Sep 2026 · ⚠️ part and stockist
real, price indicative and to be confirmed in a browser.

### The recommended build

| Item | Part | Qty | Unit | Vendor |
|---|---|---:|---|---|
| Display (prototype) | Adafruit 4694 Sharp Memory LCD breakout | 1 | £36.50 ✅ | Pimoroni |
| Display (comparison) | EA DOGXL160W-7 | 1 | £32.28 ✅ | Digi-Key UK |
| MCU | Raspberry Pi Pico 2 | 1 | £4.80 ✅ | The Pi Hut |
| Program switch | Elma Type 01 (01-1184), 6 mm shaft | 1 | £33.51 ✅ | Don-Audio |
| Encoders | Bourns PEC11R-4220F-N0024 | 2 | ~£3 ⚠️ | Mouser UK |
| Play button | APEM AV1630C900 | 1 | ~£10 ⚠️ | Farnell UK |
| Large knob | Elma K1 Dimple 39 mm, black | 1 | £7.88 ✅ | Don-Audio |
| Small knobs | Elma K1 Pure 19 mm, black | 2 | £6.94 ✅ | Don-Audio |
| Solenoid | Ledex 195205-230 | 1 | £32.69 ✅ | Digi-Key UK |
| Solenoid (prototype) | Adafruit 412 | 1 | £5.52 ✅ | Digi-Key UK |
| PSU | Mean Well GST25B12-P1J | 1 | £10.52 ✅ | Digi-Key UK |
| Mains lead | BS1363 → IEC C13 | 1 | ~£4 ⚠️ | anywhere |
| DC inlet | Switchcraft L722A | 1 | £4.89 ✅ | Digi-Key UK |
| Logic rail | RECOM R-78E3.3-1.0 | 1 | £3.32 ✅ | Digi-Key UK |
| Switching FET | Infineon IRLZ44NPBF | 2 | £1.32 ✅ | Digi-Key UK |
| Reverse-polarity FET | Infineon IRF9540NPBF | 1 | £2.02 ✅ | Digi-Key UK |
| Flyback clamp | Littelfuse SMBJ18A TVS | 4 | £0.42 ✅ | Digi-Key UK |
| Bulk cap | Chemi-Con EKYB250ELL472MM25S 4700 µF | 2 | £1.71 ✅ | Digi-Key UK |
| Fuse holder + T2A fuse | Schurter 0031.8201 | 1 | £1.46 ✅ | Digi-Key UK |
| Solenoid isolators | ebm-papst LZ550 | 4 | £0.61 ✅ | Digi-Key UK |
| Bowl bumpers | 3M SJ5303 | 6 | £0.08 ✅ | Digi-Key UK |
| Passives, headers, wire | — | — | ~£10 | — |
| **Approximate total** | | | **~£205** | |

Mixed ex- and inc-VAT, so treat it as ±15%. That sits inside the £150–250 envelope, and
drops to about **£170** if you skip the second display and the sacrificial solenoid —
though both are cheap insurance against building the wrong thing into a wooden box.

### On the single-vendor question

Honest answer: **one vendor is achievable, but not while also getting the Elma feel.**

- **Mouser UK** is the only distributor listing *everything* — Elma switches and knobs,
  Bourns, APEM, Schurter, Raspberry Pi, Mean Well, RECOM, the display and the solenoid
  driver parts. One order, one delivery, one VAT invoice, free UK shipping over £33. But
  Elma is build-to-order there, so expect a lead-time quote rather than stock. ⚠️ No
  Mouser price could be verified — the site blocks automated access.
- **Digi-Key UK** is verified for the whole power, striker and driver half, plus the
  displays, and clears its **£65 free-delivery threshold** easily (below it, a flat £22
  applies — a strong reason to consolidate). It does not carry Elma knobs.
- **Don-Audio** has the Elma switch and all three knobs **in stock today at verified GBP
  prices**, and nothing else you need.

**The practical plan is two orders: Digi-Key UK for everything electrical, Don-Audio for
the switch and knobs.** If one order matters more than the hand-feel, put it all through
Mouser and accept the Elma lead time — or substitute a Lorlin CK1024 and lose the thing
the budget was for.

⚠️ Farnell, RS, CPC and Mouser all blocked automated price checks. Every price attributed
to them is indicative.

---

## Bill of materials, part 2 — the offline half

Nothing here comes from an electronics distributor, and several cannot sensibly be
bought online at all.

### The bowl — buy this first

| Item | Spec | Rough cost | Where |
|---|---|---|---|
| Tibetan singing bowl | 12–15 cm diameter | £30–120 | A shop you can stand in |

**Buy it in person and strike it before you pay.** Pitch and sustain vary enormously
between bowls of nominally identical size, and neither is on the label. Listen for a
long, clean decay with a single dominant tone — a bowl with a fast decay or a strong
beating wobble will sound wrong at the 1.7 s triple-strike spacing, and that spacing is a
fixed part of the interaction design.

This purchase constrains the striker geometry, the cradle, the aperture in the top and
the proportions of the whole box, so it comes before any woodwork. It is also the
cheapest way to kill the project early if a struck bowl turns out not to sound the way
the idea sounds in your head.

### Timber and finishing

| Item | Spec | Rough cost | Notes |
|---|---|---|---|
| Hardwood, carcass and top | Walnut, oak, maple or cherry, **20–25 mm solid** | £25–70 | Not ply, not MDF, for the top |
| Fascia panel | Same timber, or a contrasting black panel | £0–15 | Black is the easiest way to keep the aesthetic honest |
| Dark tinted acrylic, 2 mm | Display window | £5–10 | Hides the aperture edges |
| Hardwax oil | e.g. Osmo Polyx | £15–25 | Or ebonising, if going black |
| Glue, dowels, abrasives | PVA/Titebond, 6 mm dowel | £15 | |
| Threaded inserts + screws | M3/M4 brass | £10 | For a fascia and lid that come off repeatedly |

Sizing follows the bowl, so no cut list yet.

### Acoustic and mechanical consumables

| Item | Purpose | Rough cost |
|---|---|---|
| Silicone O-rings, 70–90 mm ID, 5–6 mm cord | Bowl cradle — buy three sizes | ~£1–3 each ⚠️ |
| Sorbothane sheet, 1.6–3 mm, Shore 50 | Solenoid end-stop pad, cut washers | ~£15–30 ⚠️ |
| Sorbothane hemispheres, 30 mm | **Enclosure feet** — where sorbothane earns its money, killing box-to-table coupling | ~£14 / set of 4 ⚠️ |
| Wool felt sheet, 3 mm + felt washers | Cradle ring, under fixings, end-stop | £8 ⚠️ |
| Leather or suede offcut | Mallet tip | £5 |
| Hardwood dowel offcut | Mallet core | — |
| Steel or aluminium stock | Solenoid sub-bracket, striker arm, pivot | £10 |

⚠️ RS and Farnell both carry suitable Sorbothane and AV mounts but blocked automated
access, so no part numbers. Polymax UK and Sorbothane UK are the obvious sources.

### Tools assumed

Hand tools only: tenon saw, coping saw for the display aperture, files, chisels, a drill
with **Forstner bits** sized to the control bushings, clamps, a square. A drill press or
a simple drilling guide is worth borrowing for the control holes — a visibly tilted knob
shaft is the one flaw that reads instantly as amateur, and it cannot be fixed after.

---

## The wooden enclosure

Wood is not a neutral choice. It is simultaneously the case, the acoustic environment
for the bowl, and the path by which the solenoid's clack reaches your ears.

### It is a soundboard whether you want it or not

A thin panel under the bowl behaves exactly like a guitar top: it takes vibration from
the bowl's base and the solenoid's frame and radiates it, colouring the tone and adding
a woody thump under the strike.

- **Use thick, solid stock for the top — 20–25 mm.** Mass and stiffness push the panel's
  own resonance up and its amplitude down.
- **Avoid plywood and MDF for the top.** Ply is engineered to be stiff and light, which
  is soundboard behaviour. MDF is well damped but dead and unpleasant to finish by hand.
- **Dense, well-damped hardwoods**: walnut, oak, maple, cherry, beech. Walnut is the
  pick — dark enough to suit the aesthetic, stable, forgiving under hand tools.
- Consider making the top a **separate plinth on isolation feet** within the carcass,
  rather than one continuous structure from bowl to solenoid.

### Hand tools only — what that rules in

- **Butt joints, glued and dowelled**, or mitres with splines. Nothing needs dovetails.
- **A flat fascia panel** carrying all four controls and the display, screwed on from
  behind. This is the most important buildability decision in the design: it turns
  "drill accurate holes in an assembled box" into "drill accurate holes in a flat board
  on the bench", and it is what lets the electronics be perfboard.
- **The display aperture** is the hard cut by hand. Easiest and best-looking: hold the
  display behind a full-width **dark acrylic strip** let into a shallow rebate, so the
  aperture edges never show.

### Solid wood moves

A 150 mm wide top can move a millimetre seasonally across the grain. Do not trap a rigid
panel in a tight rebate on all four sides, and do not glue the display or fascia rigidly
across a wide grain direction. Slot the fixing holes.

### The aesthetic problem this creates

The design language is Braun after Rams: black ground, white geometry, the screen the
one light surface. Bare oak works against all of it — light, busy, warm, competing with
the display for attention. Three ways to reconcile it, to decide consciously rather than
discover at finishing time:

1. **Ebonised or black-stained hardwood.** Keeps the black ground and the grain both.
   Closest to the prototype.
2. **Dark oiled walnut**, left honest. Reads more 1960s hi-fi than Braun appliance —
   arguably a better fit for a meditation object than for a calculator.
3. **Wood carcass, black fascia.** Preserves "the screen is the only thing you read"
   most strictly, and is easiest to build well, since the fascia can be another material
   entirely.

---

## Building it: perfboard or PCB

Both routes work, and the decision can be deferred, because of one structural choice:
**every control panel-mounts to the fascia, and the display mounts to the fascia too.**
Nothing about the panel's alignment depends on the circuit board, so the board is free to
be whatever is convenient. Flying leads to a header, and that's it.

**Perfboard** is therefore a legitimate final answer, not just a prototype stage. There
are roughly 15 nets; it fits comfortably on 70 × 90 mm.

**A PCB** (~£10–30, about a week from JLCPCB or PCBWay) buys tidiness, repeatability if
you build a second, and a clean solenoid current path. It costs a KiCad step.

### The one thing that will actually bite you, either way

The solenoid draws amps for a few milliseconds. If that current returns to the supply
through the same conductor as logic ground, the voltage across the shared resistance
appears as a step on the MCU's ground reference — **and a bell strike resets the timer
mid-sit.** This is the most likely failure mode in the build.

- Run the **solenoid return as its own conductor straight back to the PSU negative**.
  Star ground at the DC inlet.
- Put the **bulk capacitor physically next to the solenoid and MOSFET**, so the impulse
  current loop is small and local.
- Use **thick wire for the solenoid pair** (1 mm² / 18 AWG), and keep the loop short.
- Keep the flyback clamp across the coil terminals themselves, not across the MOSFET at
  the other end of a long wire.

On perfboard that means deliberately not using the ground bus for the solenoid; on a PCB,
a separate pour joined to logic ground at exactly one point. Test for it directly: run a
session, strike repeatedly, and watch for a reset.

---

## Open questions

- [ ] Does the chosen bowl sustain long enough that 1.7 s triple-strike spacing sounds
      right, or does it need to be longer?
- [ ] Sharp's silvery grey or the DOG's paper white — settle it with both in hand.
- [ ] Which of the three aesthetic reconciliations for the wood?
- [ ] Lever ratio and pivot design for the striker arm; how much overtravel clearance at
      rest?
- [ ] Does the return-stroke clack need damping as well as the strike?
- [ ] Are 1-minute detents too slow at the top of the range, and is acceleration worth
      breaking prototype parity for?
- [ ] Elma Type 04 versus Type 01 — is the heavier detent worth the lead time?
- [ ] Confirm the Ledex coil resistance against the specific 195205 datasheet before
      sizing the capacitor bank.
- [ ] Confirm the Sharp panel's FPC pin count and pitch before any PCB layout.
