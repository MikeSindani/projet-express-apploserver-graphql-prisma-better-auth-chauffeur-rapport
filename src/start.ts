import 'dotenv/config';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { register } from 'tsconfig-paths';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(__dirname, '../tsconfig.json'), 'utf8');
// tsconfig.json often contains comments - strip them before parsing JSON
const jsonText = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
const projectTsconfig = JSON.parse(jsonText);
const compilerOptions = projectTsconfig.compilerOptions || {};
const baseUrl = resolve(__dirname, compilerOptions.baseUrl || '.');
const paths = compilerOptions.paths || {};

register({ baseUrl, paths });

// Now import the actual server (which uses the TS path aliases)
import './server';
