export function computeScore({
  normalPacksCollected,
  boostPackCollected,
  remainingEnergy,
  elapsedWholeSeconds,
  outcome,
  collisionPenalty,
  potholePenalty,
}) {
  const timeBonus =
    outcome === "WIN" ? Math.max(0, 60 - elapsedWholeSeconds) * 5 : 0;

  const score =
    normalPacksCollected * 100 +
    boostPackCollected * 150 +
    remainingEnergy * 2 +
    timeBonus -
    collisionPenalty -
    potholePenalty;

  return Math.max(0, score);
}

export function liveScore({
  normalPacksCollected,
  boostPackCollected,
  remainingEnergy,
  potholePenalty,
}) {
  return computeScore({
    normalPacksCollected,
    boostPackCollected,
    remainingEnergy,
    elapsedWholeSeconds: 0,
    outcome: "LOSE",
    collisionPenalty: 0,
    potholePenalty,
  });
}
