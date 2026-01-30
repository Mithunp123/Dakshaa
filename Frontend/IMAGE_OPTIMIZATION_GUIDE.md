# Image Optimization Script for DaKshaa
# This script helps optimize images for web performance

# STEP 1: Install Sharp (Node.js image processing library)
# Run: npm install sharp --save-dev

# STEP 2: Create this script as optimize-images.mjs in the Frontend folder

```javascript
// optimize-images.mjs
import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const INPUT_DIR = './src/assets';
const OUTPUT_DIR = './src/assets/optimized';
const MAX_WIDTH = 800; // Max width for card images
const QUALITY = 80; // WebP quality (0-100)

async function optimizeImages() {
  try {
    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    // Get all files
    const files = await readdir(INPUT_DIR);
    
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      const filePath = join(INPUT_DIR, file);
      const stats = await stat(filePath);
      
      // Skip directories and non-image files
      if (stats.isDirectory() || !['.png', '.jpg', '.jpeg'].includes(ext)) {
        continue;
      }
      
      // Skip if already small
      if (stats.size < 100 * 1024) { // Less than 100KB
        console.log(`⏭️  Skipping ${file} (already small)`);
        continue;
      }
      
      const outputName = basename(file, ext) + '.webp';
      const outputPath = join(OUTPUT_DIR, outputName);
      
      console.log(`🔄 Optimizing ${file}...`);
      
      await sharp(filePath)
        .resize(MAX_WIDTH, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: QUALITY })
        .toFile(outputPath);
      
      const newStats = await stat(outputPath);
      const savings = ((stats.size - newStats.size) / stats.size * 100).toFixed(1);
      
      console.log(`✅ ${file} -> ${outputName} (${savings}% smaller)`);
    }
    
    console.log('\n✨ Image optimization complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

optimizeImages();
```

# STEP 3: Run the script
# node optimize-images.mjs

# ALTERNATIVE: Online Tools
# - https://squoosh.app/ (Google's image optimizer)
# - https://tinypng.com/ (PNG/JPEG compression)
# - https://cloudinary.com/ (Cloud-based optimization)

# RECOMMENDED IMAGE SIZES:
# - Hero images: max 1200px width, WebP format
# - Card images: max 400-600px width, WebP format
# - Thumbnails: max 200px width, WebP format
# - Icons: SVG when possible, or PNG < 50KB
