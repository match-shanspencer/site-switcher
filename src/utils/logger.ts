const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

export const error = (message: string): void => {
  console.error(`${RED}✗${RESET} ${message}`);
};

export const success = (message: string): void => {
  console.log(`${GREEN}✓${RESET} ${message}`);
};

export const info = (message: string): void => {
  console.log(`${BLUE}ℹ${RESET} ${message}`);
};

export const warn = (message: string): void => {
  console.warn(`${YELLOW}⚠${RESET} ${message}`);
};

export const log = (message: string): void => {
  console.log(message);
};

export const heading = (message: string): void => {
  console.log(`${CYAN}${message}${RESET}`);
};

export const dim = (message: string): void => {
  console.log(`${GRAY}${message}${RESET}`);
};

export const table = (headers: string[], rows: string[][]): void => {
  const colWidths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map(row => (row[i] || '').length));
    return Math.max(header.length, maxRowWidth);
  });

  const headerRow = headers.map((header, i) => header.padEnd(colWidths[i])).join('  ');
  console.log(`${CYAN}${headerRow}${RESET}`);

  const separator = colWidths.map(width => '─'.repeat(width)).join('  ');
  console.log(`${GRAY}${separator}${RESET}`);

  for (const row of rows) {
    const formattedRow = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('  ');
    console.log(formattedRow);
  }
};
