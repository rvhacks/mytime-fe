/**
 * Shared utility for building avatar image URLs.
 *
 * Handles various formats returned by the backend:
 *  - Full URL:     "http://localhost:5001/uploads/avatars/xxx.jpg"
 *  - Relative URL: "/uploads/avatars/xxx.jpg"
 *  - Filename:     "xxx.jpg"
 *  - null/empty:   returns null (caller should show initials)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
// Strip /api suffix to get the base host
const API_HOST = API_URL.replace(/\/api\/?$/, '');

export function buildAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;

  // Already a full URL
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Relative path like "/uploads/avatars/xxx.jpg"
  if (avatarPath.startsWith('/uploads')) {
    return `${API_HOST}${avatarPath}`;
  }

  // Just a filename like "930e1d00-xxx.jpg"
  const filename = avatarPath.includes('/') ? avatarPath.split('/').pop()! : avatarPath;
  return `${API_HOST}/uploads/avatars/${filename}`;
}
