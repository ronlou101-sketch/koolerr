/**
 * Generates trimmed logo variants from the approved Koolerr source PNG.
 *
 * Outputs:
 *   public/Koolerr_Logo_Trimmed.png   — full logo, transparent padding removed
 *   public/Koolerr_Logo_Wordmark.png  — icon + Koolerr text + swoosh, no tagline
 */
import sharp from 'sharp'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const INPUT = path.join(ROOT, 'public/Koolerr_Logo_Transparent.png')
const PAD_PCT = 0.015 // 1.5% padding around trimmed content

async function getPixelData(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, ...info }
}

function findContentBounds(data, width, height, channels) {
  let minX = width, maxX = 0, minY = height, maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, maxX, minY, maxY }
}

// Find the vertical gap between the blue swoosh and the tagline text.
// Scans rows within the bottom 35% of content, looking for the lowest-density row
// that is above the center of the gap — that's our cut point.
function findTaglineSplitY(data, width, height, channels, minX, maxX, minY, maxY) {
  const contentH = maxY - minY + 1
  const contentW = maxX - minX + 1

  // Only search in the bottom 40% of content (where swoosh + tagline live)
  const searchFromY = Math.floor(minY + contentH * 0.60)
  const searchToY = maxY

  // Compute per-row alpha density within content x-bounds
  const rowDensities = []
  for (let y = searchFromY; y <= searchToY; y++) {
    let sum = 0
    for (let x = minX; x <= maxX; x++) {
      sum += data[(y * width + x) * channels + 3]
    }
    rowDensities.push({ y, density: sum / (contentW * 255) })
  }

  // Smooth with a 3-row window
  const smoothed = rowDensities.map((_, i) => {
    const slice = rowDensities.slice(Math.max(0, i - 1), i + 2)
    return {
      y: rowDensities[i].y,
      density: slice.reduce((s, r) => s + r.density, 0) / slice.length,
    }
  })

  // Find the minimum density row — this is the gap between swoosh and tagline
  let minDensity = Infinity
  let splitY = searchFromY
  for (const row of smoothed) {
    if (row.density < minDensity) {
      minDensity = row.density
      splitY = row.y
    }
  }

  console.log(`  Tagline gap: y=${splitY}, density=${minDensity.toFixed(4)}`)
  return splitY
}

async function cropWithPadding(inputPath, left, top, cropW, cropH, padPct) {
  const { width: srcW, height: srcH } = await sharp(inputPath).metadata()

  const padX = Math.round(cropW * padPct)
  const padY = Math.round(cropH * padPct)

  const finalLeft = Math.max(0, left - padX)
  const finalTop = Math.max(0, top - padY)
  const finalRight = Math.min(srcW, left + cropW + padX)
  const finalBottom = Math.min(srcH, top + cropH + padY)

  return sharp(inputPath)
    .extract({
      left: finalLeft,
      top: finalTop,
      width: finalRight - finalLeft,
      height: finalBottom - finalTop,
    })
    .png()
    .toBuffer()
}

async function main() {
  console.log('Loading source logo...')
  const { data, width, height, channels } = await getPixelData(INPUT)
  console.log(`  Source: ${width}×${height}, channels=${channels}`)

  console.log('Finding content bounds...')
  const { minX, maxX, minY, maxY } = findContentBounds(data, width, height, channels)
  const contentW = maxX - minX + 1
  const contentH = maxY - minY + 1
  console.log(`  Content: x=${minX}–${maxX}, y=${minY}–${maxY} (${contentW}×${contentH})`)

  // --- 1. Full trimmed logo ---
  console.log('\nGenerating Koolerr_Logo_Trimmed.png...')
  const trimmedBuf = await cropWithPadding(INPUT, minX, minY, contentW, contentH, PAD_PCT)
  const trimmedMeta = await sharp(trimmedBuf).metadata()
  const trimmedPath = path.join(ROOT, 'public/Koolerr_Logo_Trimmed.png')
  await sharp(trimmedBuf).toFile(trimmedPath)
  console.log(`  Written: ${trimmedPath} (${trimmedMeta.width}×${trimmedMeta.height})`)

  // --- 2. Wordmark (no tagline) ---
  console.log('\nFinding tagline split...')
  const splitY = findTaglineSplitY(data, width, height, channels, minX, maxX, minY, maxY)

  // Add a small buffer above the split so we don't clip the swoosh
  const cutY = splitY - Math.round(contentH * 0.005)
  const wordmarkH = cutY - minY

  console.log(`\nGenerating Koolerr_Logo_Wordmark.png (height to y=${cutY})...`)
  const wordmarkBuf = await cropWithPadding(INPUT, minX, minY, contentW, wordmarkH, PAD_PCT)
  const wordmarkMeta = await sharp(wordmarkBuf).metadata()
  const wordmarkPath = path.join(ROOT, 'public/Koolerr_Logo_Wordmark.png')
  await sharp(wordmarkBuf).toFile(wordmarkPath)
  console.log(`  Written: ${wordmarkPath} (${wordmarkMeta.width}×${wordmarkMeta.height})`)

  // Write previews to /tmp for verification
  await sharp(trimmedBuf).resize({ width: 600 }).toFile('/tmp/preview_trimmed.png')
  await sharp(wordmarkBuf).resize({ width: 600 }).toFile('/tmp/preview_wordmark.png')
  console.log('\nPreviews written to /tmp/preview_trimmed.png and /tmp/preview_wordmark.png')

  // Print final intrinsic dimensions for use in next/image width/height props
  console.log('\n--- Use these in next/image ---')
  console.log(`Trimmed:  width={${trimmedMeta.width}} height={${trimmedMeta.height}}`)
  console.log(`Wordmark: width={${wordmarkMeta.width}} height={${wordmarkMeta.height}}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
