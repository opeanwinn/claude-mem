#!/usr/bin/env node

/**
 * claude-mem — A memory management plugin for Claude
 * Fork of thedotmack/claude-mem
 *
 * Main entry point: parses CLI args and dispatches to subcommands.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

const MEM_DIR = join(homedir(), ".claude-mem");
const MEM_FILE = join(MEM_DIR, "memories.json");

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStore {
  version: number;
  memories: Memory[];
}

function ensureStore(): MemoryStore {
  if (!existsSync(MEM_DIR)) {
    mkdirSync(MEM_DIR, { recursive: true });
  }
  if (!existsSync(MEM_FILE)) {
    const initial: MemoryStore = { version: 1, memories: [] };
    writeFileSync(MEM_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(MEM_FILE, "utf-8")) as MemoryStore;
}

function saveStore(store: MemoryStore): void {
  writeFileSync(MEM_FILE, JSON.stringify(store, null, 2));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function addMemory(content: string, tags: string[] = []): Memory {
  const store = ensureStore();
  const now = new Date().toISOString();
  const mem: Memory = {
    id: generateId(),
    content,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  store.memories.push(mem);
  saveStore(store);
  return mem;
}

export function listMemories(tag?: string): Memory[] {
  const store = ensureStore();
  if (tag) {
    return store.memories.filter((m) => m.tags.includes(tag));
  }
  return store.memories;
}

export function deleteMemory(id: string): boolean {
  const store = ensureStore();
  const before = store.memories.length;
  store.memories = store.memories.filter((m) => m.id !== id);
  if (store.memories.length < before) {
    saveStore(store);
    return true;
  }
  return false;
}

export function searchMemories(query: string): Memory[] {
  const store = ensureStore();
  const lower = query.toLowerCase();
  return store.memories.filter(
    (m) =>
      m.content.toLowerCase().includes(lower) ||
      m.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

// CLI entrypoint
if (require.main === module) {
  const [, , cmd, ...args] = process.argv;

  switch (cmd) {
    case "add": {
      const content = args.join(" ");
      if (!content) { console.error("Usage: claude-mem add <content> [#tag ...]"); process.exit(1); }
      const tags = args.filter((a) => a.startsWith("#")).map((a) => a.slice(1));
      const text = args.filter((a) => !a.startsWith("#")).join(" ");
      const mem = addMemory(text, tags);
      console.log(`Added memory [${mem.id}]`);
      break;
    }
    case "list": {
      const tag = args[0]?.replace(/^#/, "");
      const mems = listMemories(tag);
      if (mems.length === 0) { console.log("No memories found."); break; }
      // Show most recent memories first
      const sorted = [...mems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      sorted.forEach((m) => {
        const tagStr = m.tags.length ? ` [${m.tags.map((t) => `#${t}`).join(" ")}]` : "";
        console.log(`[${m.id}]${tagStr} ${m.content}`);
      });
      break;
    }
    case "search": {
      const query = args.join(" ");
      if (!query) { console.error("Usage: claude-mem search <query>"); process.exit(1); }
      const results = searchMemories(query);
      if (results.length === 0) { console.log("No memories found."); break; }
      results.forEach((m) => {
        const tagStr = m.tags.length ? ` [${m.tags.map((t) => `#${t}`).join(" ")}]` : "";
        console.log(`[${m.id}]${tagStr} ${m.content}`);
      });
      break;
    }
    case "delete": {
      const id = args[0];
      if (!id) { console.error("Usage: claude-mem delete <id>"); process.exit(1); }
      const ok = deleteMemory(id);
      console.log(ok ? `Deleted memory [${id}]` : `Memory [${id}] not found.`);
      break;
    }
    default:
      console.log("Usage: claude-mem <add|list|search|delete> [...args]");
      process.exit(1);
  }
}
