import React, { useRef, useState } from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import "./Whiteboard.scss";

/**
 * A Whiteboard component using Excalidraw.
 *
 * Includes a basic export-to-PNG workflow:
 *  1) Renders a button to export the current drawings as a PNG blob
 *  2) Creates a local URL from the blob that can be used to download the file
 */
export const Whiteboard = () => {
  // This ref will be assigned an API instance via the excalidrawAPI prop
  const excalidrawRef = useRef<any>(null);

  // Once we create a PNG blob from Excalidraw, store its download URL here
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Triggered by our "Export as PNG" button
  const handleExport = async () => {
    if (!excalidrawRef.current) {
      return;
    }
    // Retrieve relevant pieces for export
    const elements = excalidrawRef.current.getSceneElements();
    if (!elements?.length) {
      // no elements to export
      return;
    }
    const appState = excalidrawRef.current.getAppState();
    const files = excalidrawRef.current.getFiles();

    // Convert scene to a PNG blob
    const blob = await exportToBlob({
      elements,
      appState,
      files,
      mimeType: "image/png",
      quality: 1,
    });
    // Create local URL for our newly created blob
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-toolbar">
        <button onClick={handleExport}>Export as PNG</button>
        {blobUrl && (
          <a href={blobUrl} download="whiteboard.png">
            Download PNG
          </a>
        )}
      </div>

      <div className="whiteboard-excalidraw">
        <Excalidraw excalidrawAPI={(api) => (excalidrawRef.current = api)} />
      </div>
    </div>
  );
};

export default Whiteboard; 