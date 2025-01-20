/**
 * Synthetic "screen capture" hook that produces a real video track by periodically
 * drawing the whiteboard <canvas> onto an offscreen canvas, then calling
 * offscreenCanvas.captureStream(fps).
 *
 * Returns a standard MediaStream with a "video" track, so your server sees it
 * as a real screen share instead of PNG images.
 */

import { useState, useEffect, useRef } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useScreenCapture(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const captureIntervalId = useRef<number | null>(null);

  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      const c = document.createElement("canvas");
      c.width = 1280;
      c.height = 720;
      offscreenCanvasRef.current = c;
      offscreenCtxRef.current = c.getContext("2d") || null;
    }
  }, []);

  const drawWhiteboardToOffscreen = () => {
    const whiteboardEl = document.querySelector(".whiteboard-container");
    if (!whiteboardEl) return;

    const wbCanvas = whiteboardEl.querySelector("canvas") as HTMLCanvasElement | null;
    if (!wbCanvas || !offscreenCanvasRef.current || !offscreenCtxRef.current) return;

    const offscreen = offscreenCanvasRef.current;
    const ctx = offscreenCtxRef.current;
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(wbCanvas, 0, 0, offscreen.width, offscreen.height);
  };

  const start = async (): Promise<MediaStream> => {
    console.log("[useScreenCapture] start() called.");
    if (isStreaming && stream) {
      return stream;
    }
    if (!offscreenCanvasRef.current) {
      throw new Error("[useScreenCapture] No offscreen canvas available!");
    }

    const fps = 5;
    const mediaStream = offscreenCanvasRef.current.captureStream(fps);

    captureIntervalId.current = window.setInterval(() => {
      drawWhiteboardToOffscreen();
    }, 1000 / fps);

    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  };

  const stop = () => {
    console.log("[useScreenCapture] stop() called.");
    if (captureIntervalId.current) {
      clearInterval(captureIntervalId.current);
      captureIntervalId.current = null;
    }

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    setStream(null);
    setIsStreaming(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  const result: UseMediaStreamResult = {
    type: "screen",
    start,
    stop,
    isStreaming,
    stream,
  };

  return result;
}