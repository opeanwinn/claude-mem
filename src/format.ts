/**
 * Formatting utilities for memory output display.
 * Handles pretty-printing of memories for CLI and plugin output.
 */

import { Memory, MemoryStore } from './types';

/** ANSI color codes for terminal output */
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
} as const;

/**
 * Format a single memory entry for display.
 * @param memory - The memory object to format
 * @param index - Optional 1-based index for list display
 * @param useColor - Whether to include ANSI color codes (default: true)
 */
export function formatMemory(
  memory: Memory,
  index?: number,
  useColor = true
): string {
  const c = useColor ? COLORS : Object.fromEntries(
    Object.keys(COLORS).map((k) => [k, ''])
  ) as typeof COLORS;

  const prefix = index !== undefined ? `${c.dim}${index}.${c.reset} ` : '';
  const id = `${c.dim}[${memory.id}]${c.reset}`;
  const timestamp = formatTimestamp(memory.createdAt, useColor);
  const tags = memory.tags && memory.tags.length > 0
    ? ` ${c.magenta}${memory.tags.map((t) => `#${t}`).join(' ')}${c.reset}`
    : '';

  return `${prefix}${c.bold}${memory.content}${c.reset}${tags}\n  ${id} ${timestamp}`;
}

/**
 * Format a list of memories for display.
 * @param memories - Array of memory objects
 * @param useColor - Whether to include ANSI color codes
 */
export function formatMemoryList(
  memories: Memory[],
  useColor = true
): string {
  if (memories.length === 0) {
    const c = useColor ? COLORS : { dim: '', reset: '', yellow: '' } as typeof COLORS;
    return `${c.yellow}No memories found.${c.reset}`;
  }

  return memories
    .map((mem, i) => formatMemory(mem, i + 1, useColor))
    .join('\n\n');
}

/**
 * Format a timestamp into a human-readable relative or absolute string.
 * @param isoString - ISO 8601 date string
 * @param useColor - Whether to apply dim styling
 */
export function formatTimestamp(isoString: string, useColor = true): string {
  const c = useColor ? COLORS : { dim: '', reset: '' } as typeof COLORS;
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative: string;
  if (diffSecs < 60) {
    relative = 'just now';
  } else if (diffMins < 60) {
    relative = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays}d ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  return `${c.dim}${relative}${c.reset}`;
}

/**
 * Format a count summary line.
 * @param count - Number of memories
 * @param label - Optional label (default: 'memory'/'memories')
 * @param useColor - Whether to include ANSI color codes
 */
export function formatCount(
  count: number,
  label = 'memory',
  useColor = true
): string {
  const c = useColor ? COLORS : { green: '', dim: '', reset: '' } as typeof COLORS;
  const plural = count === 1 ? label : `${label.replace(/y$/, 'ie')}s`;
  return `${c.green}${count}${c.reset} ${c.dim}${plural}${c.reset}`;
}

/**
 * Strip ANSI escape codes from a string for plain-text output.
 * @param str - String potentially containing ANSI codes
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}
