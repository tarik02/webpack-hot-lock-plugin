import { readFile, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';

const versionToSet = argv[2];

const packagePath = 'package.json';

const packageJson = JSON.parse(
  await readFile(packagePath, 'utf-8')
);

packageJson.version = versionToSet;

await writeFile(
  packagePath,
  JSON.stringify(packageJson, undefined, 4)
);
