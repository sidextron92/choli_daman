"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";

export function DesignImagePreview({ id, name, eager = false, unoptimized = false }: { id: string; name: string; eager?: boolean; unoptimized?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);

  function touchDistance(touches: TouchEvent<HTMLDivElement>["touches"]) {
    const x = touches[0].clientX - touches[1].clientX;
    const y = touches[0].clientY - touches[1].clientY;
    return Math.hypot(x, y);
  }

  function startPinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) pinchDistanceRef.current = touchDistance(event.touches);
  }

  function movePinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchDistanceRef.current) return;
    event.preventDefault();
    const distance = touchDistance(event.touches);
    const scaleChange = distance / pinchDistanceRef.current;
    setZoom((current) => Math.min(3, Math.max(1, current * scaleChange)));
    pinchDistanceRef.current = distance;
  }

  function endPinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) pinchDistanceRef.current = null;
  }

  function closePreview() {
    dialogRef.current?.close();
    setZoom(1);
  }

  return <>
    <button className="design-image-link" type="button" onClick={() => dialogRef.current?.showModal()} aria-label={`Preview ${name}`}>
      <Image src={`/api/design-images/${id}`} alt={name} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, (max-width: 1400px) 25vw, 20vw" loading={eager ? "eager" : "lazy"} unoptimized={unoptimized} />
    </button>
    <dialog ref={dialogRef} className="design-preview-dialog" onClose={() => setZoom(1)}>
      <div className="design-preview-header">
        <strong>{name}</strong>
        <div className="design-preview-controls">
          <button type="button" onClick={() => setZoom((current) => Math.max(1, current - .5))} disabled={zoom <= 1} aria-label="Zoom out"><Minus size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((current) => Math.min(3, current + .5))} disabled={zoom >= 3} aria-label="Zoom in"><Plus size={18} /></button>
          <button type="button" onClick={closePreview} aria-label="Close image preview"><X size={20} /></button>
        </div>
      </div>
      <div className="design-preview-viewport" onTouchStart={startPinch} onTouchMove={movePinch} onTouchEnd={endPinch} onTouchCancel={endPinch}>
        <div className="design-preview-canvas" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <Image src={`/api/design-images/${id}`} alt={name} fill sizes="100vw" unoptimized={unoptimized} />
        </div>
      </div>
    </dialog>
  </>;
}
