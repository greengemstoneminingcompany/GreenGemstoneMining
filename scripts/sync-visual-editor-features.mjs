import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve('src/lib/creativeStudioFeatures.js');
const outputPath = resolve('public/visual-editor/features/creative-studio.js');
await copyFile(sourcePath, outputPath);
console.log('Synced Creative Studio feature module from its canonical source.');
