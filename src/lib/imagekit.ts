import "server-only";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_FILES_URL = "https://api.imagekit.io/v1/files";
const FILE_ID_FRAGMENT = "ik-file-id=";

function privateKey() {
  const key = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!key) throw new Error("Missing required environment variable: IMAGEKIT_PRIVATE_KEY");
  return key;
}

function authorization() {
  return `Basic ${Buffer.from(`${privateKey()}:`).toString("base64")}`;
}

export function imageKitFileId(url: string) {
  try {
    const fragment = new URL(url).hash.slice(1);
    return fragment.startsWith(FILE_ID_FRAGMENT) ? decodeURIComponent(fragment.slice(FILE_ID_FRAGMENT.length)) : null;
  } catch {
    return null;
  }
}

export async function uploadDesignImage(file: File, fileName: string) {
  const body = new FormData();
  body.set("file", file, fileName);
  body.set("fileName", fileName);
  body.set("folder", "/choli-daman/designs");
  body.set("useUniqueFileName", "true");
  body.set("tags", "choli-daman,design");

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: authorization(), Accept: "application/json" },
    body,
    cache: "no-store",
  });
  const result = await response.json().catch(() => null) as { fileId?: string; url?: string; message?: string } | null;
  if (!response.ok || !result?.fileId || !result.url) {
    throw new Error(result?.message || "ImageKit could not upload the design image.");
  }

  return {
    fileId: result.fileId,
    publicUrl: `${result.url}#${FILE_ID_FRAGMENT}${encodeURIComponent(result.fileId)}`,
  };
}

export async function deleteImageKitFile(fileId: string) {
  const response = await fetch(`${IMAGEKIT_FILES_URL}/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: authorization(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) throw new Error("ImageKit could not delete the design image.");
}
