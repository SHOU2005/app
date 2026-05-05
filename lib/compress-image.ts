// Compress an image File/Blob to base64 JPEG under maxKB kilobytes
export async function compressImage(
  file: File | Blob,
  maxKB = 250,
  maxSize = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      // Binary-search quality until under maxKB
      let lo = 0.3, hi = 0.85, best = ''
      for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2
        const data = canvas.toDataURL('image/jpeg', mid)
        const kb = Math.round((data.length * 3) / 4 / 1024)
        if (kb <= maxKB) { best = data; lo = mid } else { hi = mid }
      }
      resolve(best || canvas.toDataURL('image/jpeg', 0.3))
    }
    img.onerror = reject
    img.src = url
  })
}
