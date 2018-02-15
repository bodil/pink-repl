import wrap from "word-wrap";

function findLineStart(s, i) {
  let pos = i;
  while (pos >= 0 && s[pos] !== "\n") {
    pos--;
  }
  pos++;
  return {index: pos, column: i - pos};
}

function findLineEnd(s, i) {
  let pos = i;
  while (pos < s.length && s[pos] !== "\n") {
    pos++;
  }
  return pos;
}

function findLineNumber(s, i) {
  let pos = i, l = 1;
  while (pos >= 0) {
    pos--;
    if (s[pos] === "\n") {
      l++;
    }
  }
  return l;
}

/**
 * Given a string and an index, return the line number, column position, and
 * the whole line at that index.
 * @arg s - The string to look into.
 * @arg i - The index into the string.
 * @returns {object} - An object containing the line, row and column.
 */
function findLine(s, i) {
  const pos = i > s.length ? s.length - 1 : i;
  const {index: start, column} = findLineStart(s, pos);
  const end = findLineEnd(s, pos);
  const row = findLineNumber(s, pos);
  return {row, column, line: s.slice(start, end)};
}

function findLocation(s, {line, column}) {
  const lines = s.split("\n");
  return {row: line, column, line: lines[line]};
}

/**
 * Repeat a string `n` times.
 */
export function repeat(n, s) {
  return n > 0 ? s + repeat(n - 1, s) : "";
}

export function formatError(error, width) {
  const {line, row, column} = error.cursor !== undefined ? findLine(error.input, error.cursor) : findLocation(error.input, error.loc);
  const header = `At line ${row}, column ${column}:\n\n`;
  const arrowhead = `\n${repeat(column, " ")}^\n`;
  const arrowstem = `${repeat(column, " ")}|\n`;
  const msg = wrap(error.message, { // eslint-disable-line prefer-template
    width: width - 2,
    indent: repeat(Math.min(column, 2), " ")
  }) + "\n";
  if (line.trim().length) {
    return header + line + arrowhead + arrowstem + msg;
  }
  return header + msg;
}
