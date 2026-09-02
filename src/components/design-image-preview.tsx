"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";
import { designThumbnailUrl } from "@/lib/format";

export function DesignImagePreview({ id, imageUrl, name, eager = false, unoptimized = false }: { id: string; imageUrl: string; name: string; eager?: boolean; unoptimized?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const zoomRef = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailUrl = designThumbnailUrl(imageUrl);
  const thumbnailSource = thumbnailFailed ? `/api/design-images/${id}` : thumbnailUrl;

  function touchDistance(touches: TouchEvent<HTMLDivElement>["touches"]) {
    const x = touches[0].clientX - touches[1].clientX;
    const y = touches[0].clientY - touches[1].clientY;
    return Math.hypot(x, y);
  }

  function startPinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) pinchDistanceRef.current = touchDistance(event.touches);
  }

  function setFocusedZoom(nextZoom: number, clientX?: number, clientY?: number) {
    const viewport = viewportRef.current;
    const previousZoom = zoomRef.current;
    const boundedZoom = Math.min(3, Math.max(1, nextZoom));
    if (!viewport || boundedZoom === previousZoom) return;

    const rect = viewport.getBoundingClientRect();
    const localX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const localY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    const focusX = (viewport.scrollLeft + localX) / previousZoom;
    const focusY = (viewport.scrollTop + localY) / previousZoom;

    zoomRef.current = boundedZoom;
    setZoom(boundedZoom);
    requestAnimationFrame(() => {
      viewport.scrollTo({
        left: focusX * boundedZoom - localX,
        top: focusY * boundedZoom - localY,
      });
    });
  }

  function movePinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchDistanceRef.current) return;
    event.preventDefault();
    const distance = touchDistance(event.touches);
    const scaleChange = distance / pinchDistanceRef.current;
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    setFocusedZoom(zoomRef.current * scaleChange, centerX, centerY);
    pinchDistanceRef.current = distance;
  }

  function endPinch(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) pinchDistanceRef.current = null;
  }

  function closePreview() {
    dialogRef.current?.close();
    setPreviewOpen(false);
    zoomRef.current = 1;
    setZoom(1);
    viewportRef.current?.scrollTo(0, 0);
  }

  function resetPreview() {
    setPreviewOpen(false);
    zoomRef.current = 1;
    setZoom(1);
    viewportRef.current?.scrollTo(0, 0);
  }

  function openPreview() {
    setFullImageLoaded(false);
    setPreviewOpen(true);
    dialogRef.current?.showModal();
  }

  return <>
    <button className="design-image-link" type="button" onClick={openPreview} aria-label={`Preview ${name}`}>
      <Image src={thumbnailSource} alt={name} fill sizes="480px" loading={eager ? "eager" : "lazy"} unoptimized onError={() => setThumbnailFailed(true)} />
    </button>
    <dialog ref={dialogRef} className="design-preview-dialog" onClose={resetPreview}>
      <div className="design-preview-header">
        <strong>{name}</strong>
        <div className="design-preview-controls">
          <button type="button" onClick={() => setFocusedZoom(zoomRef.current - .5)} disabled={zoom <= 1} aria-label="Zoom out"><Minus size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setFocusedZoom(zoomRef.current + .5)} disabled={zoom >= 3} aria-label="Zoom in"><Plus size={18} /></button>
          <button type="button" onClick={closePreview} aria-label="Close image preview"><X size={20} /></button>
        </div>
      </div>
      <div ref={viewportRef} className="design-preview-viewport" onTouchStart={startPinch} onTouchMove={movePinch} onTouchEnd={endPinch} onTouchCancel={endPinch}>
        <div className="design-preview-canvas" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          {!fullImageLoaded ? <div className="preview-loading-backdrop" aria-hidden="true">
            <Image className="preview-thumbnail" src={thumbnailSource} alt="" fill sizes="480px" unoptimized onError={() => setThumbnailFailed(true)} />
            <span className="preview-loading-shimmer" />
          </div> : null}
          {previewOpen ? <Image className="preview-full-image" src={`/api/design-images/${id}`} alt={name} fill sizes="100vw" unoptimized={unoptimized} onLoad={() => setFullImageLoaded(true)} /> : null}
        </div>
      </div>
    </dialog>
  </>;
}
