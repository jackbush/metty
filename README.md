# Metty

A simple meditation timer. Set a practice, press play, and a struck bowl marks the stages. No app, notifications or subscriptions.

Currently a browser prototype in `web-prototype/` — [try it here](https://jackbush.github.io/metty/). Hardware to come.

## Modes

The program dial has four positions.

| Position | Segment | Stages | Total |
|---|---|---|---|
| **Off** | — | — | — |
| **Mettā Bhāvanā** | 8:00 | 5 | 40:00 |
| **Ānāpānasati** | 5:00 | 4 | 20:00 |
| **Custom** | 10:00 | 1 | 10:00 |

A preset loads a segment time and stage count; it does not lock them. The duration and repeats dials stay live in every mode, so Custom is simply the unopinionated position — any length or number of stages.

A preset can be updated by choosing it, changing it, then pressing Play and holding for 3s. The display will flash and the preset will default to the new settings for you.

## The two Triratna practices

The first two modes follow the practices as taught in the Triratna Buddhist tradition.

### 1. Ānāpānasati (Mindfulness of Breathing)

Four stages, conventionally about five minutes each,
breath unmanipulated throughout:

1. Count silently after each out-breath, 1 to 10, then start again
2. Count before each in-breath, 1 to 10, again
3. Drop the counting; follow the whole cycle of the breath as one continuous movement
4. Narrow attention to the point of sensation where the breath enters and leaves (nostril rims, upper lip)

### 2. Mettā Bhāvanā (Cultivation of loving-kindness)

Five stages, again roughly equal in length:

1. Yourself
2. A good friend — conventionally someone alive, roughly your age, not someone you're
   sexually attracted to, not close family, to keep the emotion uncomplicated
3. A "neutral" person — someone you see but have no feelings about; the barista,
   someone on your commute
4. A "difficult" person — someone you're in conflict with, or find hard
5. All four held together, then the mettā radiated outward in widening circles: the
   room, the city, the country, all sentient beings

In both, the bell is an *instruction*: it tells you to change the object of attention.

## Layout

```
web-prototype/   Browser prototype. Working dials, timers, synthesised bowl.
hardware/        Arduino build plans: BOM, wiring, enclosure, firmware notes.
COMPETITION.md   Competitive analysis: the field, the price bands, the honest weaknesses.
tasks/           Working notes, todo, lessons.
```
