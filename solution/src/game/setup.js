import { listRoadCells, cellKey, findSpawn } from "./layout";
import { PEDESTRIAN_PATH_CATALOGUE } from "./paths";

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistinct(items, count) {
  return shuffle(items).slice(0, count);
}

export function createRunConfig() {
  const roadCells = listRoadCells();
  const packCells = pickDistinct(roadCells, 4);
  const boostIndex = Math.floor(Math.random() * packCells.length);

  const packs = packCells.map((cell, index) => ({
    x: cell.x,
    y: cell.y,
    kind: index === boostIndex ? "boost" : "normal",
  }));

  const occupied = new Set(packs.map((p) => cellKey(p.x, p.y)));
  const freeForOil = roadCells.filter((c) => !occupied.has(cellKey(c.x, c.y)));
  const oilCells = pickDistinct(freeForOil, 2);
  const oils = oilCells.map((cell) => ({ x: cell.x, y: cell.y }));

  const pathIndices = pickDistinct(
    PEDESTRIAN_PATH_CATALOGUE.map((_, i) => i),
    2,
  );

  const pedestrians = pathIndices.map((pathIndex) => {
    const path = PEDESTRIAN_PATH_CATALOGUE[pathIndex];
    const index = Math.floor(Math.random() * path.length);
    const forward = Math.random() < 0.5;
    return {
      pathIndex,
      path,
      index,
      direction: forward ? 1 : -1,
      x: path[index].x,
      y: path[index].y,
    };
  });

  const spawn = findSpawn();

  return {
    packs,
    oils,
    pedestrians,
    player: { x: spawn.x, y: spawn.y },
  };
}
