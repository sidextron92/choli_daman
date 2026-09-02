import type { Design } from "@/lib/types";

export function formatDesignNumber(
  design: Pick<Design, "sequence_number" | "design_type">,
  compact = false,
) {
  const suffix = design.design_type === "OPEN_DESIGN" ? " (OD)" : "";
  return `${compact ? "#" : "Design #"}${design.sequence_number}${suffix}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function storageObjectPath(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/design_images/";
    const index = url.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

const IMAGEKIT_DESIGN_ENDPOINT = "https://ik.imagekit.io/cholidaman";
const DESIGN_THUMBNAIL_TRANSFORMATION = "w-480,h-472,c-maintain_ratio_no_enlarge,fo-bottom,q-75,f-auto";

export function designThumbnailUrl(publicUrl: string) {
  const path = storageObjectPath(publicUrl);
  if (!path) return publicUrl;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${IMAGEKIT_DESIGN_ENDPOINT}/${encodedPath}?tr=${DESIGN_THUMBNAIL_TRANSFORMATION}`;
}
