# Lessons

## Verify rotary/angle conventions against a render, not by reasoning

The program dial's angle map was inverted: `atan2(dx, -dy)` puts north-west at −45°,
not −135°, so the pointer indicated the wrong label while every unit-level value was
correct. Reading the code did not catch it; a screenshot caught it instantly.

**Rule:** for anything positional or angular, render it and look before declaring it
done. Correct numbers can still point the wrong way.

## `hidden` does not work on SVG children

The HTML `hidden` attribute is applied by the UA stylesheet to HTML elements. On SVG
elements it sets the attribute but nothing hides. Play and stop glyphs stacked.

**Rule:** ship an explicit `[hidden]{ display:none !important }` rule when toggling
`.hidden` on anything inside an `<svg>`.

## Headless Chrome clamps the viewport to 500px wide

A `--window-size=390,844` screenshot laid out at 500px and cropped the image to 390,
which looked exactly like a broken mobile layout. Nearly "fixed" CSS that was fine.

**Rule:** when a headless mobile capture looks broken, probe `innerWidth` first.
Confirm the bug is in the page, not the harness.
