/**
 * Cloudinary unsigned image upload (browser).
 * Create an unsigned upload preset in Cloudinary → Settings → Upload.
 */

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || 'marketlink';

export function isCloudinaryConfigured() {
  return Boolean(cloudName && uploadPreset);
}

/**
 * @param {File} file
 * @returns {Promise<{ ok: boolean, url?: string, error?: string }>}
 */
export async function uploadImageToCloudinary(file) {
  if (!isCloudinaryConfigured()) {
    return { ok: false, error: 'Cloudinary is not configured. Set VITE_CLOUDINARY_* env vars.' };
  }
  if (!file || !file.type?.startsWith('image/')) {
    return { ok: false, error: 'Please choose an image file.' };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: 'Image must be under 8 MB.' };
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  if (folder) body.append('folder', folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message || 'Cloudinary upload failed.' };
    }
    const url = json.secure_url || json.url;
    if (!url) return { ok: false, error: 'Upload succeeded but no URL returned.' };
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error during upload.' };
  }
}
