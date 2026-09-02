"use client";

import { Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

function loadImage(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The design image could not be prepared.")); };
    image.src = url;
  });
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

async function buildShareImage(id: string, designNumber: string) {
  const response = await fetch(`/api/design-images/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("The design image could not be loaded.");
  const image = await loadImage(await response.blob());
  const maxDimension = 2048;
  const scale = Math.min(1, maxDimension / image.naturalWidth, maxDimension / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The design image could not be prepared.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const fontSize = Math.max(28, Math.round(Math.min(canvas.width, canvas.height) * 0.045));
  const paddingX = Math.round(fontSize * 0.62);
  const paddingY = Math.round(fontSize * 0.42);
  const margin = Math.max(20, Math.round(fontSize * 0.65));
  context.font = `700 ${fontSize}px Arial, sans-serif`;
  context.textBaseline = "middle";
  const labelWidth = context.measureText(designNumber).width + paddingX * 2;
  const labelHeight = fontSize + paddingY * 2;
  roundedRect(context, margin, margin, labelWidth, labelHeight, Math.round(fontSize * 0.4));
  context.fillStyle = "rgba(15, 38, 68, .88)";
  context.fill();
  context.fillStyle = "#ffffff";
  context.fillText(designNumber, margin + paddingX, margin + labelHeight / 2);

  const output = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!output) throw new Error("The design image could not be prepared.");
  const filename = `${designNumber.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
  return new File([output], filename, { type: "image/jpeg" });
}

export function WhatsAppShareButton({ id, designNumber, category }: {
  id: string;
  designNumber: string;
  category: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void buildShareImage(id, designNumber)
      .then((generatedFile) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(generatedFile);
        setFile(generatedFile);
        setPreviewUrl(objectUrl);
        setNativeShareSupported(typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [generatedFile] })));
      })
      .catch((generationError: unknown) => {
        if (active) setError(generationError instanceof Error ? generationError.message : "The design image could not be prepared.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, designNumber]);

  async function shareImage() {
    if (!file || !nativeShareSupported) return;
    setError("");
    setSharing(true);
    try {
      await navigator.share({ title: designNumber, files: [file] });
    } catch (shareError) {
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) {
        setError(shareError instanceof Error ? shareError.message : "The image could not be shared.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className="share-layout">
      <div className="share-preview">
        <div className="share-image generated-share-image">
          {previewUrl ? (
            // The source is a client-generated Blob URL, which Next Image cannot optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={`${designNumber} with design-number overlay`} />
          ) : error ? (
            <p className="share-preview-error">{error}</p>
          ) : (
            <div className="share-preview-loading"><span className="spinner" /> Preparing image preview…</div>
          )}
        </div>
        <div className="share-caption">
          <p className="eyebrow">Share preview</p>
          <h1>{designNumber}</h1>
          <p>{category}</p>
        </div>
      </div>

      <aside className="share-actions">
        <a className="button primary large" href={previewUrl || undefined} download={file?.name} aria-disabled={!file}>
          <Download size={18} /> Download image
        </a>
        {nativeShareSupported ? (
          <button className="button secondary large" type="button" onClick={() => void shareImage()} disabled={!file || sharing}>
            <Share2 size={18} /> {sharing ? "Opening share sheet…" : "Share image"}
          </button>
        ) : null}
        {error && previewUrl ? <p className="form-message error">{error}</p> : null}
      </aside>
    </section>
  );
}
