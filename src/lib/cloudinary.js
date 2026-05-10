/**
 * Cloudinary unsigned upload helper.
 * Uploads directly from browser → Cloudinary CDN, no backend involvement.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary לא מוגדר');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'שגיאה בהעלאת תמונה');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Returns a transformed URL with a width limit, ideal for thumbnails / mobile.
 * Cloudinary serves WebP/AVIF automatically (f_auto) when set.
 */
export function thumbnailUrl(url, width = 400) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
}
