const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

function extractObjectLiteral(source, variableName) {
  const declaration = new RegExp(
    `(?:^|[^\\w$.])(?:(?:const|let|var)\\s+)?${escapeRegExp(variableName)}\\s*=\\s*`
  );
  const declarationMatch = source.match(declaration);
  const declarationIndex = declarationMatch?.index ?? -1;

  assert.notStrictEqual(declarationIndex, -1, `Could not find "${variableName}" in index.html.`);

  const objectStart = findNextValueStart(
    source,
    declarationIndex + declarationMatch[0].length
  );
  assert.strictEqual(source[objectStart], '{', `"${variableName}" must be assigned to an object literal.`);

  const objectEnd = findMatchingBrace(source, objectStart);

  assert.notStrictEqual(objectEnd, -1, `Could not find the end of "${variableName}".`);

  const objectLiteral = source.slice(objectStart, objectEnd + 1);
  const unsupportedSyntax = stripStringsAndComments(objectLiteral);
  assert.ok(
    !/(^|[^\w$])(undefined|NaN|Infinity)(?=[^\w$]|$)|\[\s*,|,\s*,/.test(unsupportedSyntax),
    `"${variableName}" contains JavaScript-only values that this test intentionally does not support.`
  );
  const jsonLiteral = quoteBareObjectKeys(normalizeJavaScriptObjectLiteral(objectLiteral));

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
        const escaped = next;

        if (escaped === undefined) {
          normalized += '\\\\';
          index += 1;
          continue;
        }

        if (escaped === 'u' && /^[\da-fA-F]{4}$/.test(source.slice(index + 2, index + 6))) {
          normalized += `\\u${source.slice(index + 2, index + 6)}`;
          index += 6;
          continue;
        }

        if (escaped === quote) {
          normalized += escaped === '"' ? '\\"' : escaped;
        } else if (escaped === '"') {
          normalized += '\\"';
        } else if ('\\/bfnrt'.includes(escaped)) {
          normalized += `\\${escaped}`;
        } else {
          normalized += escaped === '"' ? '\\"' : escaped;
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

function stripStringsAndComments(source) {
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
      } else {
        normalized += ' ';
      }
      index += 1;
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        normalized += '  ';
        index += 2;
        continue;
      }

      normalized += current === '\n' ? '\n' : ' ';
      index += 1;
      continue;
    }

    if (quote) {
      if (current === '\\') {
        normalized += '  ';
        index += 2;
        continue;
      }

      if (current === quote) {
        quote = null;
      }

      normalized += current === '\n' ? '\n' : ' ';
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      normalized += '  ';
      index += 2;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = true;
      normalized += '  ';
      index += 2;
      continue;
    }

    if (current === "'" || current === '"') {
      quote = current;
      normalized += '0';
      index += 1;
      continue;
    }

    normalized += current;
    index += 1;
  }

  return normalized;
}

function quoteBareObjectKeys(source) {
  let normalized = '';

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];

    if (current === '"') {
      normalized += current;
      index += 1;

      while (index < source.length) {
        normalized += source[index];

        if (source[index] === '\\') {
          index += 1;
          normalized += source[index] ?? '';
        } else if (source[index] === '"') {
          break;
        }

        index += 1;
      }

      continue;
    }

    normalized += current;

    if (current !== '{' && current !== ',') {
      continue;
    }

    let cursor = index + 1;
    let whitespace = '';

    while (/\s/.test(source[cursor] ?? '')) {
      whitespace += source[cursor];
      cursor += 1;
    }

    if (!/[A-Za-z_$]/.test(source[cursor] ?? '')) {
      normalized += whitespace;
      index = cursor - 1;
      continue;
    }

    let key = '';

    while (/[\w$]/.test(source[cursor] ?? '')) {
      key += source[cursor];
      cursor += 1;
    }

    let suffixWhitespace = '';

    while (/\s/.test(source[cursor] ?? '')) {
      suffixWhitespace += source[cursor];
      cursor += 1;
    }

    if (source[cursor] !== ':') {
      normalized += `${whitespace}${key}${suffixWhitespace}`;
      index = cursor - 1;
      continue;
    }

    normalized += `${whitespace}"${key}"${suffixWhitespace}`;
    index = cursor - 1;
  }

  return normalized;
}

function escapeRegExp(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function findNextValueStart(source, startIndex) {
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

    if (!/\s/.test(current)) {
      return index;
    }
  }

  return -1;
}

function extractSectionText(source, className) {
  const sections = [
    ...source.matchAll(/<section([^>]*)>([\s\S]*?)<\/section>/g),
  ];
  const match = sections.find(([, attributes]) => {
    const classMatch = attributes.match(/\bclass=(["'])([^"']*)\1/);

    return classMatch?.[2].split(/\s+/).includes(className);
  });

  assert.ok(match, `Could not find the "${className}" section in index.html.`);
  return match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countElementsWithClass(source, tagName, className) {
  return [...source.matchAll(new RegExp(`<${tagName}([^>]*)>`, 'g'))].filter(([, attributes]) => {
    const classMatch = attributes.match(/\bclass=(["'])([^"']*)\1/);

    return classMatch?.[2].split(/\s+/).includes(className);
  }).length;
}

function extractReadmeAreas(markdown) {
  return Object.fromEntries(
    [...markdown.matchAll(/^\s*-\s+\*\*(.+?)\*\*\s*—\s*(.*)$/gm)].map(([, area, useCases]) => [
      area,
      useCases.trim(),
    ])
  );
}

let dashboardFixture;
function getDashboardFixture() {
  if (!dashboardFixture) {
    const dashboardData = extractObjectLiteral(html, 'data');
    const totalAreas = Object.keys(dashboardData).length;
    const totalUseCases = Object.values(dashboardData).reduce(
      (count, useCases) => count + useCases.length,
      0
    );
    const activeAreas = Object.values(dashboardData).filter((useCases) => useCases.length > 0).length;
    const practicesCount = countElementsWithClass(html, 'div', 'practice');

    dashboardFixture = {
      dashboardData,
      kpisText: extractSectionText(html, 'kpis'),
      practicesCount,
      activeAreasPercentage:
        totalAreas === 0 ? '0%' : `${Math.round((activeAreas / totalAreas) * 100)}%`,
      totalAreas,
      totalUseCases,
    };
  }

  return dashboardFixture;
}

test('README dashboard areas can be parsed', () => {
  assert.ok(Object.keys(extractReadmeAreas(readme)).length > 0);
});

test('findMatchingBrace ignores braces inside strings and comments', () => {
  const source = `{ text: "}", /* } */ nested: { ok: true } } trailing`;

  assert.strictEqual(findMatchingBrace(source, 0), source.indexOf(' trailing') - 1);
});

test('extractObjectLiteral parses supported JavaScript object syntax safely', () => {
  const source = `const data = {
    // comment
    area: ['One', 'Two',],
    nested: {
      label: "{ok}"
    }
  };`;

  assert.deepStrictEqual(extractObjectLiteral(source, 'data'), {
    area: ['One', 'Two'],
    nested: {
      label: '{ok}',
    },
  });
});

test('extractObjectLiteral accepts flexible spacing around declarations', () => {
  const source = `const   data\t =\t{ item: ["value"] };`;

  assert.deepStrictEqual(extractObjectLiteral(source, 'data'), {
    item: ['value'],
  });
});

test('extractObjectLiteral rejects unsupported JavaScript-only values', () => {
  for (const source of [
    `const data = { item: [undefined] };`,
    `const data = { item: [NaN] };`,
    `const data = { item: [Infinity] };`,
    `const data = { item: [,"value"] };`,
    `const data = { item: ["value",, "other"] };`,
  ]) {
    assert.throws(
      () => extractObjectLiteral(source, 'data'),
      /contains JavaScript-only values/
    );
  }
});

test('README area parsing preserves empty use-case lists', () => {
  assert.deepStrictEqual(
    extractReadmeAreas('    - **Financeiro** — '),
    { Financeiro: '' }
  );
});

test('README area parsing requires the documented em dash separator', () => {
  assert.deepStrictEqual(extractReadmeAreas('- **Financeiro** — Caixa'), {
    Financeiro: 'Caixa',
  });
  assert.deepStrictEqual(extractReadmeAreas('- **Financeiro**  —   Caixa'), {
    Financeiro: 'Caixa',
  });
  assert.deepStrictEqual(extractReadmeAreas('- **Financeiro** - Caixa'), {});
});

test('README dashboard areas match the source data in index.html', () => {
  const {dashboardData} = getDashboardFixture();
  const expectedReadmeAreas = Object.fromEntries(
    Object.entries(dashboardData).map(([area, useCases]) => [area, useCases.join(', ')])
  );
  const matchingReadmeAreas = Object.fromEntries(
    Object.entries(extractReadmeAreas(readme)).filter(([area]) =>
      Object.hasOwn(dashboardData, area)
    )
  );
  const sortedExpectedAreas = Object.keys(expectedReadmeAreas).sort((leftArea, rightArea) =>
    leftArea.localeCompare(rightArea)
  );
  const sortedReadmeAreas = Object.keys(matchingReadmeAreas).sort((leftArea, rightArea) =>
    leftArea.localeCompare(rightArea)
  );

  assert.deepStrictEqual(sortedReadmeAreas, sortedExpectedAreas);

  assert.deepStrictEqual(
    Object.entries(matchingReadmeAreas).sort(([leftArea], [rightArea]) =>
      leftArea.localeCompare(rightArea)
    ),
    Object.entries(expectedReadmeAreas).sort(([leftArea], [rightArea]) =>
      leftArea.localeCompare(rightArea)
    )
  );
});

test('Dashboard KPI cards match the source data', () => {
  const {activeAreasPercentage, kpisText, practicesCount, totalAreas, totalUseCases} =
    getDashboardFixture();

  assert.match(kpisText, new RegExp(`\\b${escapeRegExp(String(totalAreas))}\\s+Áreas AI Driven\\b`));
  assert.match(
    kpisText,
    new RegExp(`\\b${escapeRegExp(String(totalUseCases))}\\s+Casos de uso mapeados\\b`)
  );
  assert.match(
    kpisText,
    new RegExp(`\\b${escapeRegExp(activeAreasPercentage)}\\s+Áreas com IA ativa\\b`)
  );
  assert.match(
    kpisText,
    new RegExp(`\\b${escapeRegExp(String(practicesCount))}\\s+Boas práticas-guia\\b`)
  );
});

test('README best-practice count matches the page', () => {
  const {practicesCount} = getDashboardFixture();
  const match = readme.match(/^\s*-\s+\*\*[^*]+\*\* — (\d+) boas práticas\b.*$/m);

  assert.ok(match, 'Could not find the best-practices summary in README.md.');
  assert.strictEqual(Number(match[1]), practicesCount);
});
