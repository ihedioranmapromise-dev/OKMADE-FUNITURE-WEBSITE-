export function getOptimizedImage(url, width = 350, quality = 60) {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&quality=${quality}`;
}

// Presets for common use cases
export function thumbImage(url) {
  return getOptimizedImage(url, 250, 55);
}
export function cardImage(url) {
  return getOptimizedImage(url, 400, 60);
}
export function heroImage(url) {
  return getOptimizedImage(url, 800, 70);
}
