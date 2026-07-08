"use client";

import { useEffect, useRef, useState } from "react";

export default function SignaturePad({ label, onDone }: { label: string; onDone: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1B2420";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawingRef.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
    setEmpty(false);
  }
  function end() {
    drawingRef.current = false;
  }
  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setEmpty(true);
  }
  function confirm() {
    if (!hasDrawnRef.current) return;
    onDone(canvasRef.current!.toDataURL("image/png"));
  }

  return (
    <div>
      <div className="text-sm font-semibold mb-2" style={{ color: "#1B2420" }}>{label}</div>
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full rounded-lg border touch-none"
        style={{ borderColor: "#DDE1D8", background: "#FAFBF9" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={clear} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: "#EEF0EA", color: "#5B6660" }}>지우기</button>
        <button
          type="button"
          onClick={confirm}
          disabled={empty}
          className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ background: "#1B2420", color: "#F7F8F5" }}
        >
          서명 확정
        </button>
      </div>
    </div>
  );
}
