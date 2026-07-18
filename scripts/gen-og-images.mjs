/**
 * Regenerates OG and Twitter card images using the trimmed logo.
 */
import sharp from 'sharp'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const TRIMMED = path.join(ROOT, 'public/Koolerr_Logo_Trimmed.png')
const APP_DIR = path.join(ROOT, 'app')

async function makeOgImage(outFile, w, h) {
  const padPct = 0.10
  const maxW = Math.round(w * (1 - padPct * 2))
  const maxH = Math.round(h * (1 - padPct * 2))

  const logoResized = await sharp(TRIMMED)
    .resize(maxW, maxH, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const { width: lw, height: lh } = await sharp(logoResized).metadata()
  const left = Math.floor((w - lw) / 2)
  const top = Math.floor((h - lh) / 2)

  await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .composite([{ input: logoResized, left, top }])
    .png()
    .toFile(outFile)

  console.log(`  Written: ${outFile} (logo at ${lw}×${lh})`)
}

async function main() {
  await makeOgImage(path.join(APP_DIR, 'opengraph-image.png'), 1200, 630)
  await makeOgImage(path.join(APP_DIR, 'twitter-image.png'), 1200, 600)
}

main().catch((err) => { console.error(err); process.exit(1) })
