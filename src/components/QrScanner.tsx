"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QrScanner({
  onDecode,
  onClose,
}: {
  onDecode: (text: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const decodedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        setError(
          "카메라를 사용할 수 없어요. 브라우저의 카메라 권한을 허용했는지 확인해주세요."
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || decodedRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            decodedRef.current = true;
            onDecode(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,36,32,0.85)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: "#F7F8F5" }}>QR 스캔</span>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: "#F7F8F5" }}>닫기</button>
        </div>
        <div className="rounded-2xl overflow-hidden relative" style={{ background: "#000" }}>
          <video ref={videoRef} playsInline muted className="w-full h-auto block" />
          <canvas ref={canvasRef} className="hidden" />
          <div
            className="absolute inset-8 rounded-xl pointer-events-none"
            style={{ border: "3px solid rgba(184,134,59,0.9)" }}
          />
        </div>
        {error ? (
          <p className="text-sm mt-3 text-center" style={{ color: "#E39A87" }}>{error}</p>
        ) : (
          <p className="text-sm mt-3 text-center" style={{ color: "#DDE1D8" }}>매장에 붙어있는 QR을 화면 안에 맞춰주세요.</p>
        )}
      </div>
    </div>
  );
}
