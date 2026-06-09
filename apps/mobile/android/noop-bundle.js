const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'app', 'src', 'main', 'assets');
const srcBundle = path.join(srcDir, 'index.android.bundle');

const args = process.argv;
let bundleOutput = null;
let assetsDest = null;
let sourcemapOutput = null;
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--bundle-output' && args[i+1]) bundleOutput = args[i+1];
  if (args[i] === '--assets-dest' && args[i+1]) assetsDest = args[i+1];
  if (args[i] === '--sourcemap-output' && args[i+1]) sourcemapOutput = args[i+1];
}

// Strip leading 'android\' or 'android/' since __dirname is already the android dir
function resolvePath(p) {
  if (path.isAbsolute(p)) return p;
  return path.join(__dirname, p.replace(/^android[\\/]/, ''));
}

if (bundleOutput) {
  const outputAbsPath = resolvePath(bundleOutput);
  fs.mkdirSync(path.dirname(outputAbsPath), { recursive: true });
  if (fs.existsSync(srcBundle)) {
    fs.copyFileSync(srcBundle, outputAbsPath);
  } else {
    console.error('Source bundle not found:', srcBundle);
    process.exit(1);
  }
}

if (sourcemapOutput) {
  const mapAbsPath = resolvePath(sourcemapOutput);
  fs.mkdirSync(path.dirname(mapAbsPath), { recursive: true });
  const srcMap = path.join(__dirname, 'app', 'build', 'sourcemaps', 'index.android.bundle.packager.map');
  if (fs.existsSync(srcMap)) {
    fs.copyFileSync(srcMap, mapAbsPath);
  } else {
    fs.writeFileSync(mapAbsPath, '{"version":3,"sources":[],"names":[],"mappings":""}');
  }
}

if (assetsDest) {
  const assetsAbsPath = resolvePath(assetsDest);
  const srcRaw = path.join(srcDir, 'raw');
  if (fs.existsSync(srcRaw)) {
    const destRaw = path.join(assetsAbsPath, 'raw');
    fs.mkdirSync(destRaw, { recursive: true });
    fs.readdirSync(srcRaw).forEach(f => fs.copyFileSync(path.join(srcRaw, f), path.join(destRaw, f)));
  }
}

process.exit(0);
