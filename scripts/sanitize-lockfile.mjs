// Réécrit les URLs "resolved" d'un proxy Artifactory vers registry.npmjs.org (aucune URL interne dans le dépôt).
// Usage : node scripts/sanitize-lockfile.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../package-lock.json', import.meta.url);
const proxyPrefix = /https:\/\/[^"/]+\/artifactory\/api\/npm\/[^"/]+\//g;
const text = readFileSync(file, 'utf8');
const offenders = text.match(proxyPrefix) ?? [];

if (offenders.length) {
  writeFileSync(file, text.replace(proxyPrefix, 'https://registry.npmjs.org/'));
}
console.log(`${offenders.length} URL(s) de proxy remplacée(s).`);
