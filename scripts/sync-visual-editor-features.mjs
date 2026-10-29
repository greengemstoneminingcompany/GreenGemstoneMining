import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

const sourcePath = resolve('src/lib/creativeStudioFeatures.ts');
const outputPath = resolve('public/visual-editor/features/creative-studio.js');
const source = await readFile(sourcePath, 'utf8');
const result = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
  fileName: sourcePath,
});
if (result.diagnostics?.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) {
  throw new Error('Could not compile the Creative Studio feature module.');
}
await writeFile(outputPath, result.outputText, 'utf8');
console.log('Synced Creative Studio feature module from TypeScript source.');
