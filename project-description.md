# Test Project Outline – Module E – SwapLoop ChargeRun Interactive Frontend App

## Competition time

Competitors will have **3 hours** to complete this module.

## Introduction

SwapLoop is a fictional Shanghai community pilot exploring safer alternatives to charging e-bike batteries indoors. Compatible delivery and private e-bikes exchange removable batteries at swap stations; e-bikes with integrated batteries use monitored charging bays; delivery partners can receive controlled priority access; and operators and safety inspectors manage sites, assets, and incidents.

**ChargeRun** is a short on-kiosk game: the player steers an e-bike across a small street grid, collects energy packs, avoids pedestrians and oil hazards, and tries to reach a Battery Swap Cabinet before energy runs out. When the run ends (win or lose), the player opens the **Charge Card** studio - a canvas editor that builds a personal score card (background, SwapLoop frame, score text, and signature). The card can be downloaded, shared, or sent to a printer.

The application must run **independently**. It must **not** call a backend API, Station Service, or rider-facing REST endpoints. All behaviour is client-side, using the supplied card assets and the rules in this brief.

## General Description of Project and Tasks

Implement an independently runnable single-page application presented as a **fixed-size horizontal kiosk**.

There are **exactly two screens**:

1. **Game** - ChargeRun (DOM/CSS/JS), keyboard-controlled.
2. **Charge Card studio** - canvas compositor with upload, signature, download, share, and print.

High-level capabilities (details in [Requirements](#requirements)):

- Fixed **1280×720** px kiosk shell (not responsive) - align the kiosk in the middle of the screen
- ChargeRun grid game with per-run randomization, energy, packs, hazards, pedestrians, cabinet goal, and scoring
- Charge Card studio: background (file input + drag-and-drop), dynamic text, signature, download, share, print
- `localStorage` for display name
- Use Shanghai timezone and Chinese date format when formatting any visible date/time on the Charge Card.
- Installable / downloadable web app from Chrome. You only have to provide the minimum configuration to make the APP installable. Logos can be found under the `assets/logos` folder.
- Prefer labelled buttons and visible focus for DOM controls. Color must not be the only way to distinguish win vs lose.
- Load card assets from [`assets`](./assets).
- Target the latest **Google Chrome** for assessment.
- Use the provided `Inter` font wherever possible

### Vocabulary

| Term                     | Meaning                                              |
| ------------------------ | ---------------------------------------------------- |
| **SwapLoop**             | Platform brand                                       |
| **ChargeRun**            | Name of this kiosk mini-game                         |
| **Charge Card**          | Personal achievement image created after a run       |
| **SwapLoop Station**     | Service location the cabinet belongs to in the story |
| **Battery Swap Cabinet** | Goal cell - reach it with energy remaining to win    |
| **Energy pack**          | Collectible that restores energy                     |
| **Oil hazard**           | One-time energy penalty cell                         |
| **Pedestrian**           | Moving obstacle - collision loses the run            |

### Suggested time split

| Block | Focus                  | Approx. time |
| ----- | ---------------------- | ------------ |
| A     | Kiosk shell, ChargeRun | ~1.5 hours   |
| B     | Charge Card studio     | ~1.5 hours   |

## Requirements

### Kiosk shell and navigation

1. Provide a fixed horizontal kiosk stage of exactly **1280×720** pixels. Centre it on the page.
2. Only two screens exist, both INSIDE the kiosk: **Game** and **Charge Card studio**.
3. SPA navigation between those two screens without a full browser reload.
4. On app load, open the **Game** screen directly (no start menu).
5. From the Charge Card studio, provide a **Play again** control that returns to the Game screen and starts a **new** run setup (re-roll randomization, frozen until the first move key).
6. Pass the completed run’s outcome (`WIN` \| `LOSE`) and final score into the card studio.

### ChargeRun (game)

Build the game described here.

#### Story and goal

The player controls an e-bike on a small city grid. Energy drains over time. Collect energy packs to stay powered. Avoid pedestrians and oil hazards. Reach the **Battery Swap Cabinet** with energy remaining to win.

#### Run states

| State     | Behaviour                                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `READY`   | Grid is set up and visible. Player is on spawn. Energy drain and pedestrians are **frozen**. Show hint: `Press Arrow keys or WASD to start`.                                                                               |
| `RUNNING` | Entered on the **first** valid movement key (`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `W` / `A` / `S` / `D`). That same key also moves the player one cell. Energy drain and pedestrian movement are active. |

There is **no** Start button. Opening the Game screen always leaves the run in `READY` until the first movement key.

#### Grid (fixed structure)

1. Build a rectangular grid of **DOM cells** with **12 columns × 8 rows**.
2. Hard-code one fixed base layout for:
   - exactly **1** `SPAWN` cell
   - exactly **1** `CABINET` cell
   - enough `OBSTACLE` cells to shape the streets
   - all other cells are `ROAD`
3. The base layout should leave a walkable path from the spawn point to the cabinet. Place the spawn and cabinet far from each other, but ensure the game is winnable.
4. Distinguish cell types visually (by color, border, or label). No sprite pack is supplied. Design it to look good and come up with a design that fits the vibe, in your opinion.

#### Per-run randomization

Every time a run is set up (app load, and every **Play again**), roll a **new** configuration:

1. **Energy packs (4):** randomly choose **4 distinct `ROAD` cells** that are not `SPAWN` and not `CABINET`. Place one energy pack on each. Among those four, randomly mark **exactly 1** as a **boost pack** (`+40` energy instead of `+25`).
2. **Oil hazards (2):** randomly choose **2 distinct `ROAD` cells** that are not `SPAWN`, not `CABINET`, and not occupied by an energy pack. Place one oil hazard on each.
3. **Pedestrian routes (2):** hard-code a catalogue of **at least 5** ping-pong patrol paths (each path is an ordered list of `ROAD` coordinates). For each run, randomly assign **2 different** paths from that catalogue to the two pedestrians. Randomly choose each pedestrian’s starting index on their path and whether they begin moving forward or backward along the path.
4. After rolling, render the grid and place the player on `SPAWN` in `READY`.

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
4. While the Game screen is active, call `preventDefault` on these movement keys (including in `READY`).

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

Energy does **not** drain in `READY`.

#### Pedestrians

1. Exactly **2** pedestrians, each on its randomly assigned path.
2. Move each pedestrian one step every **600 ms** while `RUNNING` only (frozen in `READY`).
3. When a pedestrian reaches either end of its path, reverse direction (ping-pong).
4. If the player and a pedestrian occupy the **same cell** → immediate `LOSE`.

#### Win / lose

| Outcome | Condition                                                       |
| ------- | --------------------------------------------------------------- |
| `WIN`   | Player enters the `CABINET` cell with energy greater than 0     |
| `LOSE`  | Energy reaches 0, **or** player shares a cell with a pedestrian |

On end: navigate to the **Charge Card studio**

#### HUD

While on the Game screen, show continuously:

- current **energy**
- current **score**
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

1. Display name (string).
2. In the Charge Card studio, prefill the display name input from `localStorage` when a saved name exists.

### Charge Card studio

Opened when the game ends. The Charge Card is a **personal score certificate** for that run: a single landscape image that combines a photo background, SwapLoop branding, the player’s name and score, and a handwritten signature. It is meant to be kept (download), sent to someone (share), or printed at the kiosk.

Compose the card on an HTML `<canvas>` inside the kiosk.

**Card size:** **960×540** pixels (landscape). The downloaded PNG must be 960×540.

The preview should have `16px` border radius.

#### What appears on the card

From bottom to top:

1. **Background photo** - photo behind everything. The player can replace it. If no background is uploaded, a blue-green gradient should be displayed instead.
2. **Brand overlay** - the supplied transparent PNG (`/assets/charge-cards/charge-card-overlay.png`) drawn at full card size. This provides the SwapLoop frame / logo art; do not redraw that art yourself.
3. **Dynamic text** drawn with canvas text APIs at the positions below:
   - **Name** - player display name
     - Font: 28px, regular
     - x (right edge): 927, y: 55
     - The text should have a right aligned feeling, where the right side is always at x=800
   - **Outcome** - exactly `SAFE ARRIVAL / 平安抵达` on win, or exactly `RUN ENDED / 比赛结束` on lose
     - Font: 32px, semi bold
     - x: centered, y: 127
   - **Score** - the numeric final score, large and prominent
     - Font: 128px, bold
     - x: centered, y: 171
   - **Date** - the current date/time formatted with timezone `Asia/Shanghai (zh-CN)`
     - Font: 16px, regular
     - x: 50, y: 500
     - Date format example: 2026/8/7 10:46:42
4. **Signature** - ink strokes the player draws in the signature box.
   - x: 0, y: 358
   - width: 960, height: 120

Use fill color `#FFFFFF` for text. Signature stroke color `#FFFFFF`, line width `3`. Load and use the webfonts from [`assets/fonts/`](./assets/fonts/) for canvas text (via `document.fonts` / `FontFace` as needed so text is drawn only after the font is ready).

The `x` and `y` are the coordinates of the top-left corner, unless specified otherwise.

You can find an example of the charge card in the `assets/charge-cards` folder.

#### Studio UI (DOM controls beside or below the canvas, still inside the kiosk)

| Control           | Behaviour                                                           |
| ----------------- | ------------------------------------------------------------------- |
| Display name      | Text input; required for Download, Share, and Print; Stored locally |
| Upload background | File input                                                          |
| Reset background  | Restore the gradient                                                |
| Clear signature   | Wipe signature strokes                                              |
| Download          | Save composited PNG as `chargerun-charge-card.png`                  |
| Share             | Web Share API with the PNG file                                     |
| Print             | Send the Charge Card to the printer                                 |
| Play again        | Return to Game; set up a new randomised run in `READY`              |

#### Display name

1. Trim whitespace.
2. If empty, block Download, Share, and Print and show a visible field error.
3. Prefill from `localStorage` when set.
4. Persist the trimmed name when Download, Share, or Print is successfully initiated.

#### Background upload (file input + drag and drop)

1. Provide a visible **file input** (or a button that opens one) accepting `image/jpeg`, `image/png`, and `image/webp`.
2. Dropping a file onto the **kiosk** must run the **same** validation and apply pipeline as the file input, therefore uploading the background with drag-and-drop also works.
3. Reject other MIME types with a visible message.
4. Reject files whose **file size exceeds 5 MB** with a visible message.
5. Only accept background images with the same size as the card (960×540)
6. Draw accepted images onto the card

#### Signature pad

1. Draw with mouse on the card canvas (touch support is not required for now)
2. Clip all strokes to the signature box - no marks outside the box.
3. **Clear signature** removes all strokes.
4. If empty, block Download, Share, and Print and show: `Please sign inside the box`.

#### Download, Share, Print

1. **Download:** (PNG) → file download named `chargerun-charge-card.png`.
2. **Share:** use the Web Share API with a PNG `File`. Title/text: `SwapLoop ChargeRun`. If the function is missing or throws, show a visible fallback: tell the user to use Download or Print instead.
3. **Print:** open the browser print dialog so the Charge Card can be printed. Print the card image. Do not print the entire kiosk.
4. Do not upload the image to a custom server.

Game visuals (player, pedestrians, packs, hazards, cabinet, obstacles) are built by the competitor with DOM/CSS or simple self-added images.

## Assessment

Assessed in the latest Google Chrome by manual testing and expert review. Observable behaviour matters more than framework choice.
