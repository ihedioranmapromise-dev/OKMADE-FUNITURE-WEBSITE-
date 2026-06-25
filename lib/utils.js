export function getOptimizedImage(url, width = 600, quality = 80) {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=${quality}`;
}
