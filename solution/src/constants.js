export const COLS = 12;
export const ROWS = 8;

export const DISPLAY_NAME_KEY = "swaploop-chargerun-display-name";

export const CARD_WIDTH = 960;
export const CARD_HEIGHT = 540;
export const SIGNATURE_BOX = { x: 0, y: 358, width: 960, height: 120 };

export const OVERLAY_URL = "/assets/charge-cards/charge-card-overlay.png";

export const MAX_BACKGROUND_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_BACKGROUND_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MOVE_KEYS = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  w: { dx: 0, dy: -1 },
  a: { dx: -1, dy: 0 },
  s: { dx: 0, dy: 1 },
  d: { dx: 1, dy: 0 },
};
