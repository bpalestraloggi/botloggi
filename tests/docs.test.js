const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

function extractObjectLiteral(source, variableName) {
  const declaration = `const ${variableName} =`;
  const declarationIndex = source.indexOf(declaration);

  assert.notStrictEqual(declarationIndex, -1, `Could not find "${variableName}" in index.html.`);

  const objectStart = source.indexOf('{', declarationIndex);
  assert.notStrictEqual(objectStart, -1, `Could not find the start of "${variableName}".`);

  let depth = 0;
  let objectEnd = -1;

  for (let index = objectStart; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;

      if (depth === 0) {
        objectEnd = index;
        break;
      }
    }
  }

  assert.notStrictEqual(objectEnd, -1, `Could not find the end of "${variableName}".`);

  const objectLiteral = source.slice(objectStart, objectEnd + 1);
  const jsonLiteral = objectLiteral.replace(
    /([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g,
    '$1"$2"$3'
  );

  return JSON.parse(jsonLiteral);
}

function extractReadmeAreas(markdown) {
  return Object.fromEntries(
    [...markdown.matchAll(/^  - \*\*(.+?)\*\* — (.+)$/gm)].map(([, area, useCases]) => [
      area,
      useCases.split(', ').map((useCase) => useCase.trim()),
    ])
  );
}

function extractKpis(source) {
  return Object.fromEntries(
    [...source.matchAll(/<div class="kpi"><div class="v">([^<]+)<\/div><div class="l">([^<]+)<\/div><\/div>/g)].map(
      ([, value, label]) => [label, value]
    )
  );
}

const dashboardData = extractObjectLiteral(html, 'data');
const readmeAreas = extractReadmeAreas(readme);
const kpis = extractKpis(html);
const totalAreas = Object.keys(dashboardData).length;
const totalUseCases = Object.values(dashboardData).reduce(
  (count, useCases) => count + useCases.length,
  0
);
const activeAreas = Object.values(dashboardData).filter((useCases) => useCases.length > 0).length;
const practicesCount = [...html.matchAll(/<div class="practice">/g)].length;

test('README dashboard areas can be parsed', () => {
  assert.ok(Object.keys(readmeAreas).length > 0);
});

test('README dashboard areas match the source data in index.html', () => {
  assert.deepStrictEqual(readmeAreas, dashboardData);
});

test('Dashboard KPI cards match the source data', () => {
  assert.strictEqual(kpis['Áreas AI Driven'], String(totalAreas));
  assert.strictEqual(kpis['Casos de uso mapeados'], String(totalUseCases));
  assert.strictEqual(
    kpis['Áreas com IA ativa'],
    `${Math.round((activeAreas / totalAreas) * 100)}%`
  );
  assert.strictEqual(kpis['Boas práticas-guia'], String(practicesCount));
});

test('README best-practice count matches the page', () => {
  const match = readme.match(/- \*\*Como usar a IA da maneira correta\*\* — (\d+) boas práticas/);

  assert.ok(match, 'Could not find the best-practices summary in README.md.');
  assert.strictEqual(Number(match[1]), practicesCount);
});
