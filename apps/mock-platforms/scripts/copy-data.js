const fs = require('fs');
const path = require('path');

const platforms = ['mockMapsA', 'mockMapsB', 'mockDirectoryC'];

platforms.forEach((platform) => {
  const src = path.join(__dirname, '..', 'src', 'platforms', platform, 'data.json');
  const destDir = path.join(__dirname, '..', 'dist', 'platforms', platform);
  const dest = path.join(destDir, 'data.json');

  if (fs.existsSync(src)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  }
});
