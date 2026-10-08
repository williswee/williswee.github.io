# Coaching full-height correction

User requirement: match the other homepage chapters' viewport-height presentation and fill the entire coaching.html sidebar with artwork.

## Implemented

- Homepage uses the approved right-side overlook and left panel. Removed Coaching's content-height artwork exception and bottom mask; it inherits the shared 100svh minimum and full-cover background.
- Desktop crop is 74%; the panel is slightly narrower above 1100px to preserve both peers. Portrait tablets use the phone-style image-above-panel layout while retaining a 100svh section minimum. Mobile remains a natural reading flow.
- Reading page uses a continuous 768×2048 portrait extension generated from the original bench image with built-in ImageGen. The original wide scene remains the mobile and social image. No detached vignette or top/bottom mask remains.
- Sidebar crop script adjusts only vertical positioning and the scrollable rail's available height; it cannot shrink the covered image or expose an empty edge.

## Evidence

- At 1297×1344, all six homepage scenes measure 1344px. Coaching's expanded FAQ fits inside that height (1044.93px panel), with no horizontal overflow.
- The reading-page image and sidebar both occupy y=76 through y=1344 (1268px), with object-fit:cover and no mask. Both peers and lantern remain visible below the rail.
- Reading page also checked at 1280×720: image and sidebar both fill 644px beneath the header; the crop keeps the group below the rail.
- Homepage checked at 768×1024: the stacked scene grows to 1053.59px for its content, with both peers visible. At 390×844 the mobile reading order and crop remain usable. Settled layouts have no horizontal overflow.
- Reading-page mobile at 390×844 loads the original wide source and shows both peers and lantern above the pane. No runtime console errors observed.
- 16 home/shared-navigation tests and 12 Coaching tests pass, including full-coverage and resize/crop regressions. JavaScript syntax and git diff whitespace checks pass.
- Final layout detector returned zero matches in degraded regex mode; parser-dependent checks were unavailable. Browser checks provide the visual evidence.

Screenshots: /tmp/coaching-art-review/full-height-home-tall.jpg and /tmp/coaching-art-review/full-height-inner-tall.jpg. Local preview only.
