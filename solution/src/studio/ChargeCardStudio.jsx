import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPTED_BACKGROUND_TYPES,
  CARD_HEIGHT,
  CARD_WIDTH,
  DISPLAY_NAME_KEY,
  MAX_BACKGROUND_BYTES,
  OVERLAY_URL,
  SIGNATURE_BOX,
} from "../constants";
import { formatShanghaiDateTime } from "../utils/date";
import { loadInterFonts } from "../utils/fonts";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function drawBlueGreenGradient(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#0f766e");
  gradient.addColorStop(0.5, "#0e7490");
  gradient.addColorStop(1, "#0369a1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
}

export default function ChargeCardStudio({
  outcome,
  score,
  onPlayAgain,
  pendingBackgroundFile,
  onBackgroundHandled,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const strokesRef = useRef([]);
  const drawingRef = useRef(false);
  const fontsReadyRef = useRef(false);

  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem(DISPLAY_NAME_KEY) ?? ""
  );
  const [nameError, setNameError] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [hasCustomBackground, setHasCustomBackground] = useState(false);
  const [ready, setReady] = useState(false);
  const [cardDate] = useState(() => formatShanghaiDateTime(new Date()));

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay || !fontsReadyRef.current) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else {
      drawBlueGreenGradient(ctx);
    }

    ctx.drawImage(overlay, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "top";

    const name = displayName.trim();
    if (name) {
      ctx.font = "400 28px Inter";
      ctx.textAlign = "left";
      // Right edge of the name must sit at x=800
      const nameX = 927 - ctx.measureText(name).width;
      ctx.fillText(name, nameX, 55);
    }

    const outcomeText =
      outcome === "WIN" ? "SAFE ARRIVAL / 平安抵达" : "RUN ENDED / 比赛结束";
    ctx.font = "600 32px Inter";
    ctx.textAlign = "center";
    ctx.fillStyle = outcome === "WIN" ? "#91FF89" : "#FF8989";
    ctx.fillText(outcomeText, CARD_WIDTH / 2, 135);

    ctx.font = "700 128px Inter";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(String(score), CARD_WIDTH / 2, 185);

    ctx.font = "400 16px Inter";
    ctx.textAlign = "left";
    ctx.fillText(cardDate, 50, 500);

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      SIGNATURE_BOX.x,
      SIGNATURE_BOX.y,
      SIGNATURE_BOX.width,
      SIGNATURE_BOX.height
    );
    ctx.clip();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
    ctx.restore();
  }, [cardDate, displayName, outcome, score]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadInterFonts();
        const overlay = await loadImage(OVERLAY_URL);
        if (cancelled) return;
        overlayRef.current = overlay;
        fontsReadyRef.current = true;
        setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setUploadMessage("Failed to load card assets or fonts.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) redraw();
  }, [ready, redraw]);

  const applyBackgroundFile = useCallback(
    async (file) => {
      setShareMessage("");
      if (!file) return;

      if (!ACCEPTED_BACKGROUND_TYPES.includes(file.type)) {
        setUploadMessage("Unsupported file type. Use JPEG, PNG, or WebP.");
        return;
      }

      if (file.size > MAX_BACKGROUND_BYTES) {
        setUploadMessage("File is too large. Maximum size is 5 MB.");
        return;
      }

      try {
        const bitmap = await createImageBitmap(file);
        if (bitmap.width !== CARD_WIDTH || bitmap.height !== CARD_HEIGHT) {
          bitmap.close();
          setUploadMessage(
            `Image must be exactly ${CARD_WIDTH}×${CARD_HEIGHT} pixels.`
          );
          return;
        }

        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        URL.revokeObjectURL(url);
        bitmap.close();

        backgroundImageRef.current = img;
        setHasCustomBackground(true);
        setUploadMessage("Background applied.");
        redraw();
      } catch {
        setUploadMessage("Could not read that image file.");
      }
    },
    [redraw]
  );

  useEffect(() => {
    if (!pendingBackgroundFile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyBackgroundFile(pendingBackgroundFile).finally(() => {
      onBackgroundHandled?.();
    });
  }, [pendingBackgroundFile, applyBackgroundFile, onBackgroundHandled]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CARD_WIDTH / rect.width;
    const scaleY = CARD_HEIGHT / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const pointInSignatureBox = (point) =>
    point.x >= SIGNATURE_BOX.x &&
    point.x <= SIGNATURE_BOX.x + SIGNATURE_BOX.width &&
    point.y >= SIGNATURE_BOX.y &&
    point.y <= SIGNATURE_BOX.y + SIGNATURE_BOX.height;

  const onPointerDown = (event) => {
    // Brief: mouse drawing required; touch not required
    if (event.pointerType !== "mouse") return;

    const point = getCanvasPoint(event);
    if (!pointInSignatureBox(point)) return;

    drawingRef.current = true;
    strokesRef.current = [...strokesRef.current, [point]];
    setHasSignature(true);
    setSignatureError("");
    canvasRef.current?.setPointerCapture(event.pointerId);
    redraw();
  };

  const onPointerMove = (event) => {
    if (!drawingRef.current) return;
    const point = getCanvasPoint(event);
    if (!pointInSignatureBox(point)) return;
    const strokes = strokesRef.current;
    const current = strokes[strokes.length - 1];
    current.push(point);
    redraw();
  };

  const onPointerUp = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const validateForExport = () => {
    const trimmed = displayName.trim();
    let ok = true;

    if (!trimmed) {
      setNameError("Display name is required.");
      ok = false;
    } else {
      setNameError("");
    }

    if (!hasSignature || !strokesRef.current.some((s) => s.length >= 2)) {
      setSignatureError("Please sign inside the box");
      ok = false;
    } else {
      setSignatureError("");
    }

    return ok ? trimmed : null;
  };

  const persistName = (trimmed) => {
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  };

  const exportPngBlob = async () => {
    redraw();
    const canvas = canvasRef.current;
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("PNG export failed"));
        else resolve(blob);
      }, "image/png");
    });
  };

  const handleDownload = async () => {
    setShareMessage("");
    const trimmed = validateForExport();
    if (!trimmed) return;

    persistName(trimmed);
    const blob = await exportPngBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chargerun-charge-card.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setShareMessage("");
    const trimmed = validateForExport();
    if (!trimmed) return;

    persistName(trimmed);

    try {
      if (typeof navigator.share !== "function") {
        setShareMessage(
          "Sharing is unavailable. Use Download or Print instead."
        );
        return;
      }

      const blob = await exportPngBlob();
      const file = new File([blob], "chargerun-charge-card.png", {
        type: "image/png",
      });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        setShareMessage(
          "Sharing is unavailable. Use Download or Print instead."
        );
        return;
      }

      await navigator.share({
        title: "SwapLoop ChargeRun",
        text: "SwapLoop ChargeRun",
        files: [file],
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setShareMessage("Sharing is unavailable. Use Download or Print instead.");
    }
  };

  const handlePrint = async () => {
    setShareMessage("");
    const trimmed = validateForExport();
    if (!trimmed) return;

    persistName(trimmed);
    const blob = await exportPngBlob();
    const url = URL.createObjectURL(blob);

    const root = document.getElementById("charge-card-print-root");
    root.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Charge Card";
    img.width = CARD_WIDTH;
    img.height = CARD_HEIGHT;
    root.appendChild(img);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      root.innerHTML = "";
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    img.onload = () => {
      window.print();
    };
  };

  const resetBackground = () => {
    backgroundImageRef.current = null;
    setHasCustomBackground(false);
    setUploadMessage("Background reset to gradient.");
    redraw();
  };

  const clearSignature = () => {
    strokesRef.current = [];
    setHasSignature(false);
    setSignatureError("");
    redraw();
  };

  return (
    <div className="flex h-full w-full gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="border-2 border-dashed border-neutral-800 bg-neutral-100 px-3 py-2 text-sm font-semibold uppercase">
          [Screen] Charge Card studio — outcome:{" "}
          <span className="underline">
            {outcome === "WIN" ? "WIN / SAFE ARRIVAL" : "LOSE / RUN ENDED"}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center border-2 border-dashed border-neutral-700 bg-neutral-200 p-3">
          <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            className="max-h-full max-w-full cursor-crosshair border border-neutral-800 bg-neutral-400"
            style={{ borderRadius: "16px" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Charge Card canvas signature area"
          />
        </div>
        {!ready && (
          <div className="text-center text-xs text-neutral-600">
            Loading fonts and overlay…
          </div>
        )}
      </div>

      <aside className="flex w-72 flex-col gap-3 border-2 border-dashed border-neutral-800 bg-neutral-100 p-3">
        <div className="text-xs font-semibold tracking-wide uppercase">
          [Controls]
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span>Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError("");
              // redraw uses displayName via effect
            }}
            className="border border-neutral-800 bg-white px-2 py-1"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "name-error" : undefined}
          />
        </label>
        {nameError && (
          <p
            id="name-error"
            className="text-xs font-semibold text-neutral-900 underline"
          >
            {nameError}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span>Upload background</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              applyBackgroundFile(file);
              e.target.value = "";
            }}
            className="border border-neutral-800 bg-white px-2 py-1 text-xs"
          />
        </label>

        <button
          type="button"
          onClick={resetBackground}
          className="border-2 border-dashed border-neutral-800 bg-white px-2 py-2 text-left text-sm hover:bg-neutral-50"
        >
          Reset background
          {hasCustomBackground ? " (custom → gradient)" : " (gradient)"}
        </button>

        <button
          type="button"
          onClick={clearSignature}
          className="border-2 border-dashed border-neutral-800 bg-white px-2 py-2 text-left text-sm hover:bg-neutral-50"
        >
          Clear signature
        </button>
        {signatureError && (
          <p className="text-xs font-semibold text-neutral-900 underline">
            {signatureError}
          </p>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className="border-2 border-neutral-900 bg-neutral-800 px-2 py-2 text-left text-sm text-white"
        >
          Download
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="border-2 border-neutral-900 bg-neutral-800 px-2 py-2 text-left text-sm text-white"
        >
          Share
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="border-2 border-neutral-900 bg-neutral-800 px-2 py-2 text-left text-sm text-white"
        >
          Print
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="border-2 border-dashed border-neutral-800 bg-white px-2 py-2 text-left text-sm font-semibold hover:bg-neutral-50"
        >
          Play again
        </button>

        {uploadMessage && (
          <p className="border border-dashed border-neutral-600 bg-white px-2 py-1 text-xs">
            {uploadMessage}
          </p>
        )}
        {shareMessage && (
          <p className="border border-dashed border-neutral-600 bg-white px-2 py-1 text-xs">
            {shareMessage}
          </p>
        )}
      </aside>
    </div>
  );
}
