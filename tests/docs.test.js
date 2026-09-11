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

  const objectEnd = findMatchingBrace(source, objectStart);

  assert.notStrictEqual(objectEnd, -1, `Could not find the end of "${variableName}".`);

  const objectLiteral = source.slice(objectStart, objectEnd + 1);
  const jsonLiteral = normalizeJavaScriptObjectLiteral(objectLiteral).replace(
    /([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g,
    '$1"$2"$3'
  );

  return JSON.parse(jsonLiteral);
}

function normalizeJavaScriptObjectLiteral(source) {
  let normalized = '';
  let index = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
        normalized += current;
      }
      index += 1;
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (quote) {
      if (current === '\\') {
        const escaped = next ?? '';

        if (escaped === quote) {
          normalized += escaped === '"' ? '\\"' : escaped;
        } else if (escaped === '"') {
          normalized += '\\"';
        } else if ('\\/bfnrtu'.includes(escaped)) {
          normalized += `\\${escaped}`;
        } else {
          normalized += `\\${escaped}`;
        }

        index += 2;
        continue;
      }

      if (current === quote) {
        normalized += '"';
        quote = null;
        index += 1;
        continue;
      }

      normalized += quote === "'" && current === '"' ? '\\"' : current;
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = true;
      index += 2;
      continue;
    }

    if (current === "'" || current === '"') {
      quote = current;
      normalized += '"';
      index += 1;
      continue;
    }

    normalized += current;
    index += 1;
  }

  return normalized.replace(/,(\s*[}\]])/g, '$1');
}

function findMatchingBrace(source, startIndex) {
  let depth = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (current === '\\') {
        index += 1;
        continue;
      }

      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (current === "'" || current === '"') {
      quote = current;
      continue;
    }

    if (current === '{') {
      depth += 1;
    } else if (current === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function extractReadmeAreas(markdown) {
  return Object.fromEntries(
    [...markdown.matchAll(/^  - \*\*(.+?)\*\* — (.*)$/gm)].map(([, area, useCases]) => [
      area,
      useCases.trim() === ''
        ? []
        : useCases.split(', ').map((useCase) => useCase.trim()),
    ])
  );
}

function extractKpis(source) {
  return [...source.matchAll(/<div class="kpi"><div class="v">([^<]+)<\/div><div class="l">([^<]+)<\/div><\/div>/g)].map(
    ([, value, label]) => ({ value, label })
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
const activeAreasPercentage =
  totalAreas === 0 ? '0%' : `${Math.round((activeAreas / totalAreas) * 100)}%`;

test('README dashboard areas can be parsed', () => {
  assert.ok(Object.keys(readmeAreas).length > 0);
});

test('README area parsing preserves empty use-case lists', () => {
  assert.deepStrictEqual(
    extractReadmeAreas('  - **Financeiro** — '),
    { Financeiro: [] }
  );
});

test('README dashboard areas match the source data in index.html', () => {
  assert.deepStrictEqual(readmeAreas, dashboardData);
});

test('Dashboard KPI cards match the source data', () => {
  assert.strictEqual(kpis[0]?.value, String(totalAreas));
  assert.strictEqual(kpis[1]?.value, String(totalUseCases));
  assert.strictEqual(kpis[2]?.value, activeAreasPercentage);
  assert.strictEqual(kpis[3]?.value, String(practicesCount));
});

test('README best-practice count matches the page', () => {
  const match = readme.match(
    /^- \*\*Como usar a IA da maneira correta\*\* — (\d+) boas práticas .*$/m
  );

  assert.ok(match, 'Could not find the best-practices summary in README.md.');
  assert.strictEqual(Number(match[1]), practicesCount);
});
