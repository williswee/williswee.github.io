# Chef Bob demo render

A silent 32-second edited presentation of actual Chef Bob replies: 1920×1080, 30 fps, 960 frames. Composition `ChefBobDemo`; entry `src/index.tsx`. No separate featured image was created.

## Source and scope

The prompts and replies in [`../source`](../source) were captured from an isolated, read-only AI session using Chef Bob at commit [`2f83dfedd7f35b817dddba85714d071659c4e5f8`](https://github.com/williswee/chef-bob/tree/2f83dfedd7f35b817dddba85714d071659c4e5f8). This is a fictional household example using the starter recipes, which are not kitchen-tested.

The video is an editorial conversation presentation, **not an app or Grok UI recording**. “Open-source skill · Sample conversation” stays visible. Prompts are shortened editorial excerpts. Recipe names, portions, approximate recipe times, quantity changes, and caveats come from the captured responses. The five-ingredient shopping preview is abbreviated; full recipes include other ingredients. The walkthrough does not claim that household data was saved, reminders were scheduled, or an allergy/nutrition check was performed.

## Render

Use Node.js with npm. Package dependencies pin React 19.1.1 and Remotion 4.0.534; development dependencies pin TypeScript 5.8.3 and React types 19.1.10.

```sh
cd .impeccable/assets/chef-bob-demo/render
npm install
npm run render
```

Remotion uses Chrome Headless Shell by default. To use an installed Chrome for Testing binary:

```sh
npm run render -- --browser-executable="/absolute/path/to/Google Chrome for Testing"
```

The result is `out/chef-bob-demo.mp4` (H.264, yuv420p, CRF 18). No audio is included. Fonts are bundled in `public/fonts`; their OFL licenses are alongside them. `node_modules`, render outputs, and logs are ignored.

## Timeline and review

| Time | Content |
| --- | --- |
| 0–4 s | Ask for three dinners for two using starter recipes |
| 4–13 s | Three-meal plan with portions and estimated recipe times |
| 13–18 s | Ask for four portions for Dinner 3 only |
| 18–23 s | Dinner 3 changes from two to four portions; other dinners remain at two |
| 23–32 s | Five main shopping ingredients; noodles and tofu double |

The final scene starts at 200 px to keep its recipe note clear of the persistent footer. The layout uses bundled DM Sans and Manrope, warm paper, dark ink, and forest green with brief fade/rise transitions. The fictional/not-kitchen-tested footer stays visible throughout.

[`timeline.json`](timeline.json) records frame boundaries. Suggested inspection frames are 60, 240, 450, 615, and 810. For example:

```sh
npx remotion still src/index.tsx ChefBobDemo out/shopping-preview.png --frame=810
```
