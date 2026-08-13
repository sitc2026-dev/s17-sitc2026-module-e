import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLS, MOVE_KEYS, ROWS } from "../constants";
import { BASE_LAYOUT, cellKey, getCellType, isWalkable } from "./layout";
import { computeScore, liveScore } from "./scoring";
import { createRunConfig } from "./setup";

function clampEnergy(value) {
  return Math.max(0, Math.min(100, value));
}

function stepPedestrian(ped) {
  const path = ped.path;
  if (path.length === 1) {
    return { ...ped, x: path[0].x, y: path[0].y };
  }

  let { index, direction } = ped;
  let next = index + direction;

  if (next < 0 || next >= path.length) {
    direction *= -1;
    next = index + direction;
  }

  const cell = path[next];
  return {
    ...ped,
    index: next,
    direction,
    x: cell.x,
    y: cell.y,
  };
}

const cellLabel = {
  OBSTACLE: "BLK",
  ROAD: "",
  SPAWN: "SPN",
  CABINET: "CAB",
};

export default function GameScreen({ onRunEnd }) {
  const [run] = useState(() => createRunConfig());
  const [state, setState] = useState("READY");
  const [player, setPlayer] = useState(run.player);
  const [packs, setPacks] = useState(run.packs);
  const [potholes, setPotholes] = useState(run.potholes);
  const [pedestrians, setPedestrians] = useState(run.pedestrians);
  const [energy, setEnergy] = useState(100);
  const [normalPacksCollected, setNormalPacksCollected] = useState(0);
  const [boostPackCollected, setBoostPackCollected] = useState(0);
  const [potholesTriggered, setPotholesTriggered] = useState(0);
  const [elapsedWholeSeconds, setElapsedWholeSeconds] = useState(0);

  const endedRef = useRef(false);
  const onRunEndRef = useRef(onRunEnd);
  onRunEndRef.current = onRunEnd;

  const stateRef = useRef(state);
  const playerRef = useRef(player);
  const packsRef = useRef(packs);
  const potholesRef = useRef(potholes);
  const pedestriansRef = useRef(pedestrians);
  const energyRef = useRef(energy);
  const normalRef = useRef(normalPacksCollected);
  const boostRef = useRef(boostPackCollected);
  const potholesTriggeredRef = useRef(potholesTriggered);
  const elapsedRef = useRef(elapsedWholeSeconds);
  const runningStartedAtRef = useRef(null);

  stateRef.current = state;
  playerRef.current = player;
  packsRef.current = packs;
  potholesRef.current = potholes;
  pedestriansRef.current = pedestrians;
  energyRef.current = energy;
  normalRef.current = normalPacksCollected;
  boostRef.current = boostPackCollected;
  potholesTriggeredRef.current = potholesTriggered;
  elapsedRef.current = elapsedWholeSeconds;

  const score = useMemo(
    () =>
      liveScore({
        normalPacksCollected,
        boostPackCollected,
        remainingEnergy: energy,
        potholePenalty: potholesTriggered * 30,
      }),
    [normalPacksCollected, boostPackCollected, energy, potholesTriggered]
  );

  const finishRun = useCallback((outcome, collisionPenalty, snapshot) => {
    if (endedRef.current) return;
    endedRef.current = true;

    const elapsed = snapshot.elapsedWholeSeconds;
    const finalScore = computeScore({
      normalPacksCollected: snapshot.normalPacksCollected,
      boostPackCollected: snapshot.boostPackCollected,
      remainingEnergy: snapshot.energy,
      elapsedWholeSeconds: elapsed,
      outcome,
      collisionPenalty,
      potholePenalty: snapshot.potholesTriggered * 30,
    });

    onRunEndRef.current({ outcome, score: finalScore });
  }, []);

  const applyCellEffects = useCallback(
    (
      nextPlayer,
      nextEnergy,
      nextPacks,
      nextPotholes,
      nextNormal,
      nextBoost,
      nextPotholesTriggered
    ) => {
      let energyValue = nextEnergy;
      let packsValue = nextPacks;
      let potholesValue = nextPotholes;
      let normalValue = nextNormal;
      let boostValue = nextBoost;
      let potholesTriggeredValue = nextPotholesTriggered;

      const pack = packsValue.find(
        (p) => p.x === nextPlayer.x && p.y === nextPlayer.y
      );
      if (pack) {
        if (pack.kind === "boost") {
          energyValue = clampEnergy(energyValue + 40);
          boostValue = 1;
        } else {
          energyValue = clampEnergy(energyValue + 25);
          normalValue += 1;
        }
        packsValue = packsValue.filter(
          (p) => !(p.x === pack.x && p.y === pack.y)
        );
      }

      const pothole = potholesValue.find(
        (hole) => hole.x === nextPlayer.x && hole.y === nextPlayer.y
      );
      if (pothole) {
        energyValue = clampEnergy(energyValue - 15);
        potholesTriggeredValue += 1;
        potholesValue = potholesValue.filter(
          (hole) => !(hole.x === pothole.x && hole.y === pothole.y)
        );
      }

      return {
        energyValue,
        packsValue,
        potholesValue,
        normalValue,
        boostValue,
        potholesTriggeredValue,
      };
    },
    []
  );

  const checkPedestrianCollision = useCallback((playerPos, peds) => {
    return peds.some((p) => p.x === playerPos.x && p.y === playerPos.y);
  }, []);

  const tryMove = useCallback(
    (dx, dy) => {
      if (endedRef.current) return;

      const currentState = stateRef.current;
      if (currentState !== "READY" && currentState !== "RUNNING") return;

      const from = playerRef.current;
      const nx = from.x + dx;
      const ny = from.y + dy;

      if (!isWalkable(nx, ny)) {
        if (currentState === "READY") {
          // Invalid first move does not start the run
          return;
        }
        return;
      }

      const nextPlayer = { x: nx, y: ny };
      let nextState = currentState;

      if (currentState === "READY") {
        nextState = "RUNNING";
        runningStartedAtRef.current = Date.now();
        setState("RUNNING");
      }

      const effects = applyCellEffects(
        nextPlayer,
        energyRef.current,
        packsRef.current,
        potholesRef.current,
        normalRef.current,
        boostRef.current,
        potholesTriggeredRef.current
      );

      setPlayer(nextPlayer);
      setPacks(effects.packsValue);
      setPotholes(effects.potholesValue);
      setEnergy(effects.energyValue);
      setNormalPacksCollected(effects.normalValue);
      setBoostPackCollected(effects.boostValue);
      setPotholesTriggered(effects.potholesTriggeredValue);

      playerRef.current = nextPlayer;
      packsRef.current = effects.packsValue;
      potholesRef.current = effects.potholesValue;
      energyRef.current = effects.energyValue;
      normalRef.current = effects.normalValue;
      boostRef.current = effects.boostValue;
      potholesTriggeredRef.current = effects.potholesTriggeredValue;
      stateRef.current = nextState;

      const snapshot = {
        energy: effects.energyValue,
        normalPacksCollected: effects.normalValue,
        boostPackCollected: effects.boostValue,
        potholesTriggered: effects.potholesTriggeredValue,
        elapsedWholeSeconds: elapsedRef.current,
      };

      if (checkPedestrianCollision(nextPlayer, pedestriansRef.current)) {
        finishRun("LOSE", 200, snapshot);
        return;
      }

      if (effects.energyValue <= 0) {
        finishRun("LOSE", 0, snapshot);
        return;
      }

      if (
        getCellType(nextPlayer.x, nextPlayer.y) === "CABINET" &&
        effects.energyValue > 0
      ) {
        const elapsed = runningStartedAtRef.current
          ? Math.floor((Date.now() - runningStartedAtRef.current) / 1000)
          : elapsedRef.current;
        finishRun("WIN", 0, { ...snapshot, elapsedWholeSeconds: elapsed });
      }
    },
    [applyCellEffects, checkPedestrianCollision, finishRun]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const move = MOVE_KEYS[key];
      if (!move) return;

      event.preventDefault();
      tryMove(move.dx, move.dy);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tryMove]);

  useEffect(() => {
    if (state !== "RUNNING" || endedRef.current) return undefined;

    const energyTimer = window.setInterval(() => {
      if (endedRef.current || stateRef.current !== "RUNNING") return;

      const nextEnergy = clampEnergy(energyRef.current - 15);
      const nextElapsed = elapsedRef.current + 1;
      setEnergy(nextEnergy);
      setElapsedWholeSeconds(nextElapsed);
      energyRef.current = nextEnergy;
      elapsedRef.current = nextElapsed;

      if (nextEnergy <= 0) {
        finishRun("LOSE", 0, {
          energy: nextEnergy,
          normalPacksCollected: normalRef.current,
          boostPackCollected: boostRef.current,
          potholesTriggered: potholesTriggeredRef.current,
          elapsedWholeSeconds: nextElapsed,
        });
      }
    }, 1000);

    const pedTimer = window.setInterval(() => {
      if (endedRef.current || stateRef.current !== "RUNNING") return;

      const nextPeds = pedestriansRef.current.map(stepPedestrian);
      setPedestrians(nextPeds);
      pedestriansRef.current = nextPeds;

      if (checkPedestrianCollision(playerRef.current, nextPeds)) {
        finishRun("LOSE", 200, {
          energy: energyRef.current,
          normalPacksCollected: normalRef.current,
          boostPackCollected: boostRef.current,
          potholesTriggered: potholesTriggeredRef.current,
          elapsedWholeSeconds: elapsedRef.current,
        });
      }
    }, 600);

    return () => {
      window.clearInterval(energyTimer);
      window.clearInterval(pedTimer);
    };
  }, [state, finishRun, checkPedestrianCollision]);

  const packMap = useMemo(() => {
    const map = new Map();
    packs.forEach((p) => map.set(cellKey(p.x, p.y), p));
    return map;
  }, [packs]);

  const potholeSet = useMemo(
    () => new Set(potholes.map((hole) => cellKey(hole.x, hole.y))),
    [potholes]
  );

  const pedMap = useMemo(() => {
    const map = new Map();
    pedestrians.forEach((p, i) => {
      const key = cellKey(p.x, p.y);
      const list = map.get(key) ?? [];
      list.push(i + 1);
      map.set(key, list);
    });
    return map;
  }, [pedestrians]);

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between border-2 border-dashed border-neutral-800 bg-neutral-100 px-3 py-2">
        <div className="text-sm font-semibold tracking-wide uppercase">
          [HUD] ChargeRun
        </div>
        <div className="flex gap-6 font-mono text-sm">
          <div>
            Energy: <span className="font-bold">{energy}</span>/100
          </div>
          <div>
            Score: <span className="font-bold">{score}</span>
          </div>
        </div>
      </header>

      {state === "READY" && (
        <div className="border border-dashed border-neutral-700 bg-white px-3 py-2 text-center text-sm">
          Press Arrow keys or WASD to start
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex flex-1 items-center justify-center border-2 border-dashed border-neutral-800 bg-neutral-200 p-3">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 56px)`,
              gridTemplateRows: `repeat(${ROWS}, 56px)`,
            }}
            role="grid"
            aria-label="ChargeRun street grid"
          >
            {Array.from({ length: ROWS }, (_, y) =>
              Array.from({ length: COLS }, (_, x) => {
                const type = BASE_LAYOUT[y][x];
                const key = cellKey(x, y);
                const pack = packMap.get(key);
                const hasPothole = potholeSet.has(key);
                const pedsHere = pedMap.get(key) ?? [];
                const isPlayer = player.x === x && player.y === y;

                let tone = "bg-slate-100 border-slate-400 text-slate-800";
                if (type === "OBSTACLE") {
                  tone = "bg-slate-600 border-slate-800 text-slate-100";
                } else if (type === "SPAWN") {
                  tone = "bg-sky-100 border-sky-600 text-sky-900";
                } else if (type === "CABINET") {
                  tone = "bg-violet-200 border-violet-700 text-violet-950";
                }

                if (hasPothole) {
                  tone = "bg-amber-200 border-amber-700 text-amber-950";
                }
                if (pack?.kind === "normal") {
                  tone = "bg-emerald-200 border-emerald-700 text-emerald-950";
                }
                if (pack?.kind === "boost") {
                  tone = "bg-lime-300 border-lime-700 text-lime-950";
                }
                if (pedsHere.length > 0) {
                  tone = "bg-rose-300 border-rose-700 text-rose-950";
                }
                if (isPlayer) {
                  tone = "bg-blue-400 border-blue-800 text-blue-950";
                }

                return (
                  <div
                    key={key}
                    role="gridcell"
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed text-[10px] leading-tight ${tone}`}
                  >
                    <span className="absolute top-0.5 left-0.5 text-[8px] opacity-70">
                      {cellLabel[type]}
                    </span>
                    {isPlayer && (
                      <span className="font-bold underline">YOU</span>
                    )}
                    {pedsHere.map((id) => (
                      <span key={id} className="font-bold">
                        PED{id}
                      </span>
                    ))}
                    {pack && (
                      <span className="font-semibold">
                        {pack.kind === "boost" ? "BOOST" : "PACK"}
                      </span>
                    )}
                    {hasPothole && <span className="font-semibold">HOLE</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="w-52 border-2 border-dashed border-neutral-800 bg-neutral-100 p-3 text-xs leading-relaxed">
          <div className="mb-2 font-semibold uppercase">Legend</div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-blue-800 bg-blue-400" />
              YOU — player
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-rose-700 bg-rose-300" />
              PED — pedestrian
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-emerald-700 bg-emerald-200" />
              PACK — +25 energy
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-lime-700 bg-lime-300" />
              BOOST — +40 energy
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-amber-700 bg-amber-200" />
              HOLE — −15 energy, −30 score
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-violet-700 bg-violet-200" />
              CAB — cabinet (goal)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-sky-600 bg-sky-100" />
              SPN — spawn
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-slate-800 bg-slate-600" />
              BLK — obstacle
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
