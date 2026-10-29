import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve('src/lib/creativeStudioFeatures.js');
const outputPath = resolve('public/visual-editor/features/creative-studio.js');
const autosaveSourcePath = resolve('src/lib/visualEditorAutosave.js');
const autosaveOutputPath = resolve('public/visual-editor/modules/server-autosave.js');
await mkdir(resolve('public/visual-editor/modules'), { recursive: true });
await copyFile(sourcePath, outputPath);
await copyFile(autosaveSourcePath, autosaveOutputPath);
console.log('Synced Creative Studio and editor autosave modules from their canonical sources.');
