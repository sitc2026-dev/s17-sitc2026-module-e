import { useCallback, useState } from "react";
import GameScreen from "./game/GameScreen";
import ChargeCardStudio from "./studio/ChargeCardStudio";

export default function App() {
  const [screen, setScreen] = useState("game");
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState(null);
  const [pendingBackgroundFile, setPendingBackgroundFile] = useState(null);

  const handleRunEnd = useCallback(({ outcome, score }) => {
    setResult({ outcome, score });
    setScreen("studio");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setPendingBackgroundFile(null);
    setRunId((id) => id + 1);
    setScreen("game");
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDrop = (event) => {
    event.preventDefault();
    if (screen !== "studio") return;
    const file = event.dataTransfer.files?.[0];
    if (file) setPendingBackgroundFile(file);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-400 p-6">
      <div
        className="relative overflow-hidden border-4 border-dashed border-neutral-900 bg-neutral-300 shadow-none"
        style={{ width: 1280, height: 720 }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-kiosk="true"
        aria-label="SwapLoop ChargeRun kiosk"
      >
        <div className="pointer-events-none absolute top-0 left-0 z-10 border-b border-r border-dashed border-neutral-800 bg-white/90 px-2 py-1 text-[10px] tracking-widest uppercase">
          Wireframe kiosk 1280×720
        </div>

        {screen === "game" && (
          <GameScreen key={runId} onRunEnd={handleRunEnd} />
        )}

        {screen === "studio" && result && (
          <ChargeCardStudio
            key={`studio-${runId}`}
            outcome={result.outcome}
            score={result.score}
            onPlayAgain={handlePlayAgain}
            pendingBackgroundFile={pendingBackgroundFile}
            onBackgroundHandled={() => setPendingBackgroundFile(null)}
          />
        )}
      </div>

      <div id="charge-card-print-root" aria-hidden="true" />
    </div>
  );
}
