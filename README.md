# Where Should We Eat? 🍜🧋🍰

A playful gachapon (capsule toy) machine that randomly picks where you and your
friends should eat. Pure HTML/CSS/JS — no backend, no build step.

## Run it

Open `index.html` in a browser, or serve the folder with any static server.

## Host on GitHub Pages

Push this folder to a repo, then **Settings → Pages → Build from branch → `main` / root**.

## Edit the restaurants

Everything lives in [`data.js`](data.js). Add or remove entries in the `food`,
`boba`, or `dessert` arrays. Only `name` is required; `latitude`/`longitude`
enable the distance filter; `rating`/`notes`/`address` show up when present.

## Features

- 🍜 / 🧋 / 🍰 categories, gachapon spin animation, confetti + synthesized sound effects
- Distance filter via the Geolocation API (denied → uses the full list)
- Dark mode + sound toggles, saved favorites, "Spin Again", no immediate repeats
