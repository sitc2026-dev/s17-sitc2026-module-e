# Test Project Outline – Module E – SwapLoop ChargeRun Interactive Frontend App

## Competition time

Competitors will have **3 hours** to complete this module.

## Introduction

SwapLoop is a fictional Shanghai community pilot exploring safer alternatives to charging e-bike batteries indoors. Compatible delivery and private e-bikes exchange removable batteries at swap stations; e-bikes with integrated batteries use monitored charging bays; delivery partners can receive controlled priority access; and operators and safety inspectors manage sites, assets, and incidents.

This competition does **not** ask for a finished production platform. This module is a **working prototype** of a **station kiosk mini-game and personal Charge Card studio**: a standalone single-page application for a SwapLoop community open day.

**ChargeRun** is a short on-kiosk game: the player steers an e-bike across a small street grid, collects energy packs, avoids pedestrians and oil hazards, and tries to reach a Battery Swap Cabinet before energy runs out. When the run ends (win or lose), the player opens the **Charge Card** studio — a canvas editor that builds a personal score card (background, SwapLoop frame, score text, and signature). The card can be downloaded, shared, or sent to a printer.

The application must run **independently**. It must **not** call a backend API, Station Service, or rider-facing REST endpoints. All behaviour is client-side, using the supplied card assets and the rules in this brief.

## General Description of Project and Tasks

Implement an independently runnable single-page application presented as a **fixed-size horizontal kiosk**.

There are **exactly two screens**:

1. **Game** — ChargeRun (DOM/CSS/JS, **not** canvas), keyboard-controlled.
2. **Charge Card studio** — canvas compositor with upload, signature, download, share, and print.

Assessors mark the solution using only a browser, the supplied card assets, and this brief.

High-level capabilities (details in [Requirements](#requirements)):

- Fixed **1280×720** px kiosk shell (not responsive)
- SPA flow between **Game** and **Card studio** only
- ChargeRun grid game with per-run randomisation, energy, packs, hazards, pedestrians, cabinet goal, and scoring
- Charge Card studio: background (file input + drag-and-drop), overlay, dynamic text, signature, download, share, print
- `localStorage` for display name and best score
- Installable / downloadable web app from Chrome

### Environment and stack

- Build a **client-side SPA** with any allowed front-end stack (vanilla HTML/CSS/JS or a listed framework).
- **No application backend.** Static file hosting or the framework’s dev server is enough. No database.
- Use the HTML **Canvas** API for the **Charge Card studio only**. The game must **not** use canvas.
- Load card assets from [`assets/module-e/`](./assets/module-e/).
- Persist the display name and best score with **`localStorage`** as specified below.

### Technical constraints

- Target the latest **Google Chrome** for assessment.
- The kiosk stage is exactly **1280×720** pixels. It must **not** be responsive: do not scale, reflow, or redesign the layout for other viewport sizes. Centre the fixed stage on the page; ignore the surrounding page area.
- Use `Asia/Shanghai` when formatting any visible date/time on the Charge Card.
- Do **not** call external network APIs for game logic, scoring, or image processing. Web Share may open the OS share sheet; printing may open the browser print dialog.
- Do **not** require a camera, microphone, WebGL, or native app shell.
- Prefer labelled buttons and visible focus for DOM controls. Colour must not be the only way to distinguish win vs lose.
- Real payments, real partner branding, real geo maps, multiplayer, physics engines, and machine learning are out of scope.

### Physical vocabulary

| Term                     | Meaning                                              |
| ------------------------ | ---------------------------------------------------- |
| **SwapLoop**             | Fictional operator / platform brand                  |
| **ChargeRun**            | Name of this kiosk mini-game                         |
| **Charge Card**          | Personal achievement image created after a run       |
| **SwapLoop Station**     | Service location the cabinet belongs to in the story |
| **Battery Swap Cabinet** | Goal cell — reach it with energy remaining to win    |
| **Energy pack**          | Collectible that restores energy                     |
| **Oil hazard**           | One-time energy penalty cell                         |
| **Pedestrian**           | Moving obstacle — collision loses the run            |

### Framing guardrails

- This is a **personal** achievement card and a **local** best score — **not** a public leaderboard of people.
- Do **not** rank, score, or shame riders, communities, or businesses in the UI.
- Hitting a pedestrian is a failure, never a source of points.
- Tone is light and operational (“charge safely outside the home”), not fear-based.

### Suggested time split

| Block | Focus                                                                       | Approx. time |
| ----- | --------------------------------------------------------------------------- | ------------ |
| A     | Kiosk shell, ChargeRun (including randomisation), `localStorage` best score | ~1.5 hours   |
| B     | Charge Card studio + installable web app                                    | ~1.5 hours   |

## Requirements

### Kiosk shell and navigation

1. Provide a fixed horizontal kiosk stage of exactly **1280×720** pixels. Centre it on the page. Do **not** make the kiosk responsive.
2. Only two screens exist, both inside the kiosk: **Game** and **Charge Card studio**.
3. SPA navigation between those two screens without a full browser reload.
4. On app load, open the **Game** screen directly (no start menu).
5. When a run ends, keep the player on the **Game** screen and show an end overlay (win/lose, score, best score, button to open the Charge Card studio). There is **no** separate result screen.
6. From the Charge Card studio, provide a **Play again** control that returns to the Game screen and starts a **new** run setup (re-roll randomisation, frozen until the first move key).
7. Pass the completed run’s outcome (`WIN` \| `LOSE`) and final score into the card studio.

### ChargeRun (game)

Build the game described here. Implement it with **HTML/CSS/JS** (or framework DOM). **Do not** use `<canvas>` for the game.

#### Story and goal

The player controls an e-bike on a small city grid. Energy drains over time. Collect energy packs to stay powered. Avoid pedestrians and oil hazards. Reach the **Battery Swap Cabinet** with energy remaining to win.

#### Run states

| State     | Behaviour                                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `READY`   | Grid is set up and visible. Player is on spawn. Energy drain and pedestrians are **frozen**. Show hint: `Press Arrow keys or WASD to start`.                                                                               |
| `RUNNING` | Entered on the **first** valid movement key (`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `W` / `A` / `S` / `D`). That same key also moves the player one cell. Energy drain and pedestrian movement are active. |
| `ENDED`   | Win or lose. Timers stopped. End overlay visible. Movement keys no longer move the player.                                                                                                                                 |

There is **no** Start button. Opening the Game screen always leaves the run in `READY` until the first movement key.

#### Grid (fixed structure)

1. Build a rectangular grid of **DOM cells** with **12 columns × 8 rows**.
2. Hard-code one fixed base layout for:
   - exactly **1** `SPAWN` cell
   - exactly **1** `CABINET` cell
   - enough `OBSTACLE` cells to shape the streets
   - all other cells `ROAD`
3. The base layout must leave a walkable path from spawn to cabinet.
4. Visually distinguish cell types (colour, border, label, or simple images you add). No sprite pack is supplied.

#### Per-run randomisation

Every time a run is set up (app load, and every **Play again**), roll a **new** configuration before entering `READY`:

1. **Energy packs (4):** randomly choose **4 distinct `ROAD` cells** that are not `SPAWN` and not `CABINET`. Place one energy pack on each. Among those four, randomly mark **exactly 1** as a **boost pack** (`+40` energy instead of `+25`).
2. **Oil hazards (2):** randomly choose **2 distinct `ROAD` cells** that are not `SPAWN`, not `CABINET`, and not occupied by an energy pack. Place one oil hazard on each.
3. **Pedestrian routes (2):** hard-code a catalogue of **at least 5** ping-pong patrol paths (each path is an ordered list of `ROAD` coordinates). For each run, randomly assign **2 different** paths from that catalogue to the two pedestrians. Randomly choose each pedestrian’s starting index on their path and whether they begin moving forward or backward along the path.
4. Random picks must use `Math.random()` (or equivalent). Two consecutive run setups must be able to differ in pack positions, boost pack choice, hazards, and/or pedestrian routes.
5. After rolling, render the grid and place the player on `SPAWN` in `READY`.

#### Player movement

1. The player moves **one cell per key press** while `RUNNING` (and the first press also transitions `READY` → `RUNNING`).
2. Required movement keys (all must work):

| Key          | Move  |
| ------------ | ----- |
| `ArrowUp`    | Up    |
| `ArrowDown`  | Down  |
| `ArrowLeft`  | Left  |
| `ArrowRight` | Right |
| `W`          | Up    |
| `S`          | Down  |
| `A`          | Left  |
| `D`          | Right |

3. Ignore moves into `OBSTACLE` cells and off the grid.
4. While the Game screen is active, call `preventDefault` on these movement keys so the page does not scroll (including in `READY`).
5. Show a short on-screen keyboard hint listing these keys.

#### Energy

| Rule               | Value                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Starting energy    | `100`                                                                                              |
| Maximum energy     | `100`                                                                                              |
| Drain              | `5` energy points every **1 second** while `RUNNING`                                               |
| Normal energy pack | Entering its cell: `+25` energy (clamp to 100); remove the pack                                    |
| Boost energy pack  | Entering its cell: `+40` energy (clamp to 100); remove the pack                                    |
| Oil hazard         | Entering its cell the first time: `−15` energy (clamp to 0); then remove the hazard from that cell |
| Energy reaches `0` | Immediate `LOSE`                                                                                   |

Energy does **not** drain in `READY` or `ENDED`.

#### Pedestrians

1. Exactly **2** pedestrians, each on its randomly assigned path.
2. Move each pedestrian one step every **600 ms** while `RUNNING` only (frozen in `READY`).
3. When a pedestrian reaches either end of its path, reverse direction (ping-pong).
4. If the player and a pedestrian occupy the **same cell** → immediate `LOSE`.

#### Win / lose

| Outcome | Condition                                                       |
| ------- | --------------------------------------------------------------- |
| `WIN`   | Player enters the `CABINET` cell with energy &gt; 0             |
| `LOSE`  | Energy reaches 0, **or** player shares a cell with a pedestrian |

On end: set state `ENDED`, stop drain and pedestrian timers, update `localStorage` best score if needed, and show the **end overlay** on the Game screen with:

- `WIN` or `LOSE`
- final score
- best score from `localStorage`
- a button **Create Charge Card** that opens the Card studio with this run’s outcome and score

#### HUD

While on the Game screen, show continuously:

- current **energy**
- current **score**
- **best score** from `localStorage`
- run state hint when `READY` (`Press Arrow keys or WASD to start`)

#### Scoring

Use integer arithmetic; clamp the final score at a minimum of `0`:

```text
score =
    (normalPacksCollected * 100)
  + (boostPackCollected * 150)
  + (remainingEnergy * 2)
  + timeBonus
  - collisionPenalty
  - hazardPenalty
```

| Term                   | Definition                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `normalPacksCollected` | Number of normal (`+25`) packs picked up                                                                     |
| `boostPackCollected`   | `1` if the boost pack was collected, else `0`                                                                |
| `remainingEnergy`      | Energy when the run ends                                                                                     |
| `timeBonus`            | On `WIN` only: `max(0, 60 - elapsedWholeSeconds) * 5`. On `LOSE`: `0`. Timer starts when entering `RUNNING`. |
| `collisionPenalty`     | `200` if the run ended by pedestrian collision; otherwise `0`                                                |
| `hazardPenalty`        | `30` per oil hazard triggered during the run                                                                 |

Update the live score when packs/hazards change; finalise on run end.

#### `localStorage`

1. Best score key: `swaploop-chargerun-best-score` (integer). After each run, if the final score is greater than the stored best, save the new best.
2. Display name key: `swaploop-chargerun-display-name` (string).
3. Show the best score on the Game HUD and on the end overlay.
4. In the Charge Card studio, prefill the display name input from `localStorage` when a saved name exists.

### Charge Card studio

Opened from the Game end overlay via **Create Charge Card**. The Charge Card is a **personal score certificate** for that run: a single landscape image that combines a photo background, SwapLoop branding, the player’s name and score, and a handwritten signature. It is meant to be kept (download), sent to someone (share), or printed at the kiosk.

Compose the card on an HTML `<canvas>` inside the kiosk.

**Card size:** **960×540** pixels (landscape). The downloaded PNG must be 960×540.

#### What appears on the card

From bottom to top:

1. **Background photo** — full-bleed behind everything. Starts as the supplied default image; the player may replace it.
2. **Dim layer** — a full-card semi-transparent black rectangle at **35%** opacity (`rgba(0, 0, 0, 0.35)`) so white/light text stays readable on any photo.
3. **Brand overlay** — the supplied transparent PNG (`overlay.png`) drawn at full card size. This provides the SwapLoop frame / logo art; do not redraw that art yourself.
4. **Dynamic text** drawn with canvas text APIs at the positions below:
   - **Name** — player display name
   - **Outcome** — exactly `SAFE ARRIVAL` on win, or exactly `RUN ENDED` on lose
   - **Score** — the numeric final score, large and prominent
   - **Date** — the current date/time formatted with timezone `Asia/Shanghai`
5. **Signature** — ink strokes the player draws in the signature box.

#### Layout coordinates

Follow [`assets/module-e/data/card-layout.json`](./assets/module-e/data/card-layout.json). The required layout is:

| Element       | Position                                                        |
| ------------- | --------------------------------------------------------------- |
| Name          | baseline at `(80, 120)`                                         |
| Outcome       | baseline at `(80, 170)`                                         |
| Score         | baseline at `(80, 260)` — font size larger than the other lines |
| Date          | baseline at `(80, 320)`                                         |
| Signature box | `{ x: 80, y: 400, w: 800, h: 100 }`                             |

Use fill colour `#FFFFFF` for text unless the overlay asset documentation specifies otherwise. Signature stroke colour `#111111`, line width `3`. Load and use the webfonts from [`assets/module-e/fonts/`](./assets/module-e/fonts/) for canvas text (via `document.fonts` / `FontFace` as needed so text is drawn only after the font is ready).

#### Studio UI (DOM controls beside or below the canvas, still inside the kiosk)

| Control           | Behaviour                                              |
| ----------------- | ------------------------------------------------------ |
| Display name      | Text input; required for Download, Share, and Print    |
| Upload background | File input **and** drag-and-drop target (see below)    |
| Reset background  | Restore `default-background.jpg`                       |
| Clear signature   | Wipe signature strokes                                 |
| Download          | Save composited PNG as `chargerun-charge-card.png`     |
| Share             | Web Share API with the PNG file                        |
| Print             | Send the Charge Card to the printer                    |
| Play again        | Return to Game; set up a new randomised run in `READY` |

#### Display name

1. Trim whitespace.
2. If empty, block Download, Share, and Print and show a visible field error.
3. Prefill from `localStorage` key `swaploop-chargerun-display-name` when set.
4. Persist the trimmed name to that key when Download, Share, or Print is successfully initiated.

#### Background upload (file input + drag and drop)

1. Provide a visible **file input** (or a button that opens one) accepting `image/jpeg`, `image/png`, and `image/webp`.
2. Provide a **drag-and-drop** zone on the studio UI. Dropping a file onto that zone must run the **same** validation and apply pipeline as the file input.
3. Reject other MIME types with a visible message.
4. Reject files whose **file size exceeds 5 MB** with a visible message.
5. After decoding, reject the image if **width &gt; 4096** or **height &gt; 4096** with a visible message.
6. Draw accepted images with **cover** framing onto the 960×540 card (scale preserving aspect ratio, centre crop).
7. **Reset background** restores the supplied default image and re-renders the card.

#### Signature pad

1. Draw with pointer/mouse on the card canvas (or a dedicated signature canvas composited into the card).
2. Clip all strokes to the signature box — no marks outside the box.
3. Draw a visible rectangle for the signature box on the card (or rely on overlay art that already shows it; if the overlay does not, stroke the box).
4. **Clear signature** removes all strokes.
5. **Empty signature:** before Download, Share, or Print, read pixels inside the signature box. If no pixel has alpha **&gt; 8**, the signature is empty.
6. If empty, block Download, Share, and Print and show: `Please sign inside the box`.

#### Download, Share, Print

1. **Download:** `canvas.toBlob` (PNG) → file download named `chargerun-charge-card.png`.
2. **Share:** use `navigator.share` with a PNG `File`. Title/text: `SwapLoop ChargeRun`. If `navigator.share` is missing or throws, show a visible fallback: tell the user to use Download or Print instead.
3. **Print:** open the browser print dialog so the Charge Card can be printed. Print the card image (for example via a hidden iframe/`window.print` on a page that shows only the card, or an equivalent approach that prints the card clearly). Do not print the entire kiosk chrome if you can avoid it.
4. Do not upload the image to a custom server.

### Required screens / areas

- **Game** — DOM grid, HUD (energy, score, best score), `READY` hint, keyboard hint, end overlay (`WIN`/`LOSE`, scores, Create Charge Card)
- **Charge Card studio** — canvas preview + name, file input, drag-and-drop zone, reset background, clear signature, download, share, print, Play again
- Error states: empty name, empty signature, invalid file type, file too large, image dimensions too large, share unavailable

### Independence

- Markable with static assets and this brief in a browser only.
- No MySQL, Station Service, or Module C/D API.

### Delivery priority

Fixed kiosk (non-responsive); Game ↔ Card studio only; `READY` until first move key; randomised packs/boost/hazards/pedestrian routes each run; ChargeRun rules as specified; `localStorage` name + best score; canvas card with required layers and layout; file input + drag-and-drop upload with type/size/dimension checks; clipped signature with empty detection; PNG download; Web Share with fallback; print; installable/downloadable web app.

## Required assets

```text
assets/module-e/
├── data/
│   └── card-layout.json
├── images/
│   └── card/
│       ├── overlay.png
│       └── default-background.jpg
└── fonts/
    └── (provided webfont files — use these for Charge Card canvas text)
```

`card-layout.json` shape:

```json
{
  "width": 960,
  "height": 540,
  "signatureBox": { "x": 80, "y": 400, "w": 800, "h": 100 },
  "text": {
    "name": { "x": 80, "y": 120 },
    "outcome": { "x": 80, "y": 170 },
    "score": { "x": 80, "y": 260 },
    "date": { "x": 80, "y": 320 }
  }
}
```

Game visuals (player, pedestrians, packs, hazards, cabinet, obstacles) are built by the competitor with DOM/CSS or simple self-added images.

## Assessment

Assessed in the latest Google Chrome by manual testing and expert review. Observable behaviour matters more than framework choice.

Assessors will verify that:

- the kiosk is exactly **1280×720** px, centred, and **not** responsive
- only **Game** and **Card studio** screens exist; app loads into Game in `READY`
- the first Arrow/WASD key starts the run and moves the player; no Start button; no separate result screen
- end overlay appears on the Game screen and can open the Card studio; **Play again** re-rolls a new run in `READY`
- each new run randomises energy pack positions, which pack is the boost, oil hazard positions, and the two pedestrian routes
- the game is a **12×8** DOM grid with fixed spawn/cabinet/obstacles plus randomised packs, hazards, and pedestrians
- movement works with **Arrow keys and WASD**; page does not scroll while the Game screen is active
- energy starts at 100, drains 5/sec while `RUNNING`, normal pack +25, boost +40, oil −15; energy 0 loses; cabinet with energy &gt; 0 wins; pedestrian overlap loses
- score matches the supplied formula; best score is stored and shown via `localStorage`
- display name is prefilled/saved via `localStorage` as specified
- card layers render in order; text uses the required outcome strings and Shanghai date; layout matches `card-layout.json`
- background can be set via **file input and drag-and-drop**; type, 5 MB, and 4096px checks work; reset restores default
- signature is clipped; empty signature blocks Download, Share, and Print
- Download saves a 960×540 PNG; Share works or shows fallback; Print opens a print flow for the card
- the app can be installed / downloaded as a web app from the browser
- no custom backend; no public people leaderboard

## Mark distribution

Draft distribution. Final criteria go in `marking/marking-scheme.json`.

| WSOS SECTION | Description                            |  Points |
| ------------ | -------------------------------------- | ------: |
| 1            | Work organization and self-management  |       5 |
| 2            | Communication and interpersonal skills |       5 |
| 3            | Design Implementation                  |      15 |
| 4            | Front-End Development                  |      70 |
| 5            | Back-End Development                   |       5 |
| **Total**    |                                        | **100** |

Section 5 covers client-only persistence (`localStorage`) and static asset loading. There is **no** server application to build.

## Out of scope

- Backend, database, Station Service, rider APIs
- Canvas-based game rendering
- Fullscreen mode
- Pause feature
- Start button / start menu / separate result screen
- Welcome / how-to screens
- Promo codes or free-swap redemption
- Public leaderboards; ranking people or businesses
- Responsive / fluid kiosk layout
- Real payments; multiplayer; physics engines; pathfinding AI
- WebGL; camera features; native apps
- Sound as a marking requirement
- Module B admin console; Module F campaign site
