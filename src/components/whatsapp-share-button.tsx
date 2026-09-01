"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

function loadImage(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The design image could not be prepared."));
    };
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

  const fontSize = Math.max(28, Math.round(Math.min(canvas.width, canvas.height) * .045));
  const paddingX = Math.round(fontSize * .62);
  const paddingY = Math.round(fontSize * .42);
  const margin = Math.max(20, Math.round(fontSize * .65));
  context.font = `700 ${fontSize}px Arial, sans-serif`;
  context.textBaseline = "middle";
  const labelWidth = context.measureText(designNumber).width + paddingX * 2;
  const labelHeight = fontSize + paddingY * 2;
  roundedRect(context, margin, margin, labelWidth, labelHeight, Math.round(fontSize * .4));
  context.fillStyle = "rgba(15, 38, 68, .88)";
  context.fill();
  context.fillStyle = "#ffffff";
  context.fillText(designNumber, margin + paddingX, margin + labelHeight / 2);

  const output = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
  if (!output) throw new Error("The design image could not be prepared.");
  return new File([output], `${designNumber.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`, { type: "image/jpeg" });
}

export function WhatsAppShareButton({ id, designNumber, message }: { id: string; designNumber: string; message: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function share() {
    setError("");
    const probe = new File([""], "design.jpg", { type: "image/jpeg" });
    if (!navigator.share || !navigator.canShare?.({ files: [probe] })) {
      window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setSharing(true);
    try {
      const file = await buildShareImage(id, designNumber);
      await navigator.share({ title: designNumber, text: message, files: [file] });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError(shareError instanceof Error ? shareError.message : "The design could not be shared.");
    } finally {
      setSharing(false);
    }
  }

  return <>
    <button className="button whatsapp large" type="button" onClick={() => void share()} disabled={sharing}><MessageCircle size={19} /> {sharing ? "Preparing image…" : "Share on WhatsApp"}</button>
    {error ? <p className="form-message error">{error}</p> : null}
  </>;
}
