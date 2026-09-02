import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/config";

const MAX_PDF = 10 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function validateFile(file, kind) {
  if (!file) return "Please choose a file.";
  if (kind === "pdf") {
    if (file.type !== "application/pdf") return "Only PDF files are allowed.";
    if (file.size > MAX_PDF) return "PDF must be 10MB or smaller.";
  } else {
    if (!IMAGE_TYPES.includes(file.type)) return "Only JPG, PNG, WEBP or AVIF images are allowed.";
    if (file.size > MAX_IMAGE) return "Image must be 5MB or smaller.";
  }
  return null;
}

/** folder: "invitation" | "program" | "images" */
export async function uploadWeddingFile(file, folder, kind) {
  const problem = validateFile(file, kind);
  if (problem) throw new Error(problem);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `wedding/${folder}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage(), path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

/**
 * Deletes a previously-uploaded file given its download URL. Best-effort:
 * if the file is already gone, or the URL isn't a Storage download URL
 * (e.g. it was cleared already, or points elsewhere), this quietly does
 * nothing instead of throwing — callers should still remove the URL from
 * Firestore regardless of whether the underlying file could be deleted.
 */
export async function deleteWeddingFile(url) {
  if (!url || !url.includes("firebasestorage")) return;
  try {
    await deleteObject(ref(storage(), url));
  } catch {
    /* already deleted, or nothing we can do about it — ignore */
  }
}