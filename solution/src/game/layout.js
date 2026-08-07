import { COLS, ROWS } from "../constants";

/** Cell types: ROAD | OBSTACLE | SPAWN | CABINET */
export const BASE_LAYOUT = [
  // 12 x 8 — spawn top-left area, cabinet bottom-right; streets form a walkable maze
  [
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "SPAWN",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "ROAD",
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
    "OBSTACLE",
    "ROAD",
    "ROAD",
    "ROAD",
    "OBSTACLE",
    "CABINET",
    "OBSTACLE",
  ],
  [
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
    "OBSTACLE",
  ],
];

export function findSpawn() {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (BASE_LAYOUT[y][x] === "SPAWN") return { x, y };
    }
  }
  throw new Error("SPAWN missing");
}

export function getCellType(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return BASE_LAYOUT[y][x];
}

export function isWalkable(x, y) {
  const type = getCellType(x, y);
  return type === "ROAD" || type === "SPAWN" || type === "CABINET";
}

export function listRoadCells() {
  const cells = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (BASE_LAYOUT[y][x] === "ROAD") cells.push({ x, y });
    }
  }
  return cells;
}

export function cellKey(x, y) {
  return `${x},${y}`;
}
