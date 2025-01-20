/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useRef } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

// You may need to install a library like html2canvas if the whiteboard
// is not a <canvas> element, or if you cannot call toDataURL() directly
// on it. Example: npm install html2canvas
//
// import html2canvas from "html2canvas";

export function useScreenCapture(): UseMediaStreamResult & {
  capturedFrame: string | null;
} {
  // For "fake" streaming, we keep a timer pointer, but no real MediaStream
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Keeps track of whether we're currently "streaming" frames
  const [isStreaming, setIsStreaming] = useState(false);

  // Holds the interval ID so we can stop capturing
  const captureIntervalId = useRef<number | null>(null);

  // We'll store the most recent captured dataURL here so we can display or inspect
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  // Helper: triggers a download of the "dataURL" as a .png file
  // (Leaving this function in case you want to enable it again later)
  const autoDownloadFrame = (dataURL: string) => {
    const link = document.createElement("a");
    link.href = dataURL;
    // Timestamp or random ID so each file name is unique
    const timestamp = Date.now();
    link.download = `whiteboard_capture_${timestamp}.png`;
    // Programmatically click the link to trigger download
    link.click();
    link.remove(); // Clean up
  };

  // Replace your original code with repeated capture of whiteboard images
  const captureFrameAndSend = async () => {
    // 1) Grab the whiteboard container element.
    const whiteboardEl = document.querySelector(".whiteboard-container") as HTMLDivElement;
    if (!whiteboardEl) {
      console.warn("Whiteboard container not found. Cannot capture.");
      return;
    }

    // 2) Render it to a canvas or use Excalidraw's "export image" if available
    // Example with "html2canvas":
    //   const canvas = await html2canvas(whiteboardEl);
    //   const dataURL = canvas.toDataURL("image/png");

    // If your whiteboard is itself <canvas>, you could do:
    //   const canvas = whiteboardEl.querySelector("canvas");
    //   const dataURL = canvas?.toDataURL("image/png");

    // For example:
    // (Pretend whiteboard is a <canvas> inside .whiteboard-container)
    const canvas = whiteboardEl.querySelector("canvas");
    if (!canvas) {
      console.warn("No <canvas> found inside .whiteboard-container");
      return;
    }
    const dataURL = canvas.toDataURL("image/png");

    // 3) Send the dataURL (the image) to your server or live API
    // e.g.:
    //    liveAPIClient.sendFrame({ dataURL });
    //
    // For demonstration, just logging it:
    console.log("Sending frame to server…", dataURL.slice(0, 40), "...");

    // Keep a copy in state
    setCapturedFrame(dataURL);

    // autoDownloadFrame(dataURL); // ← Commented out to disable automatic download
  };

  // The "start" method sets up a capture interval that grabs frames repeatedly
  const start = async () => {
    // If we were actually capturing display media, we'd do getDisplayMedia here.
    // Instead, we skip the real media capture. We just mimic it:
    setStream(null); 
    setIsStreaming(true);

    // Capture ~every second (1000ms). Adjust as desired.
    captureIntervalId.current = window.setInterval(() => {
      captureFrameAndSend().catch((err) => console.error(err));
    }, 1000);
    
    return stream as MediaStream; // Our "fake" stream (null).
  };

  // The "stop" method clears the capture interval and resets state
  const stop = () => {
    if (captureIntervalId.current) {
      clearInterval(captureIntervalId.current);
      captureIntervalId.current = null;
    }
    setIsStreaming(false);
    // This mimics stopping a real stream, e.g. track.stop()
    setStream(null);
    // Optionally clear last frame so we don't keep re-downloading it
    // setCapturedFrame(null);
  };

  // If you want to detect "end of stream" while capturing for some reason,
  // you could add an event listener, but here we do a simple setInterval approach.

  useEffect(() => {
    // Like in your original code, if you want logic that forcibly stops
    // after some event, you could do that here.

    // Clean-up on unmount
    return () => stop();
  }, []);

  // Return the same shape as the original "MediaStream" approach
  const result: UseMediaStreamResult = {
    type: "screen",
    start,
    stop,
    isStreaming,
    stream,
  };

  return {
    ...result,
    capturedFrame,
  };
}
