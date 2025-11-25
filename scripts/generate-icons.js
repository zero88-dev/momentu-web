const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../assets/logos/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Verificar se o arquivo SVG existe, caso contrário usar favicon
const faviconPath = path.join(__dirname, '../public/favicon.ico');
const useFavicon = !fs.existsSync(inputPath);

async function generateIcons() {
  console.log('Gerando ícones PWA...');

  for (const size of sizes) {
    try {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      if (useFavicon) {
        // Se não houver SVG, usar favicon
        await sharp(faviconPath)
          .resize(size, size)
          .png()
          .toFile(outputPath);
      } else {
        // Usar SVG
        await sharp(inputPath)
          .resize(size, size)
          .png()
          .toFile(outputPath);
      }

      console.log(`✓ Gerado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Erro ao gerar icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('Ícones PWA gerados com sucesso!');
}

generateIcons().catch(console.error);

