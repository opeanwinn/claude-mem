/**
 * Core type definitions for claude-mem
 * Shared interfaces and types used across the memory management system
 */

/**
 * Represents a single memory entry stored in the system
 */
export interface Memory {
  /** Unique identifier for the memory */
  id: string;
  /** The actual content/text of the memory */
  content: string;
  /** ISO 8601 timestamp of when the memory was created */
  createdAt: string;
  /** ISO 8601 timestamp of when the memory was last updated */
  updatedAt: string;
  /** Optional tags for categorizing memories */
  tags?: string[];
  /** Optional metadata for extensibility */
  metadata?: Record<string, unknown>;
}

/**
 * The root structure of the memory store (persisted to disk)
 */
export interface MemoryStore {
  /** Schema version for future migrations */
  version: number;
  /** All stored memories keyed by their ID */
  memories: Memory[];
}

/**
 * Options for adding a new memory
 */
export interface AddMemoryOptions {
  /** Optional tags to associate with the memory */
  tags?: string[];
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for searching memories
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Filter results by tags */
  tags?: string[];
  /** Whether the search should be case-sensitive */
  caseSensitive?: boolean;
}

/**
 * A memory entry with its relevance score from a search
 */
export interface SearchResult {
  /** The matched memory */
  memory: Memory;
  /** Relevance score (higher = more relevant) */
  score: number;
  /** Snippet of content showing the match context */
  snippet?: string;
}

/**
 * Result of a list operation
 */
export interface ListResult {
  /** The memories returned */
  memories: Memory[];
  /** Total count of memories in the store */
  total: number;
}

/**
 * Options for listing memories
 */
export interface ListOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip (for pagination) */
  offset?: number;
  /** Filter by tags */
  tags?: string[];
  /** Sort order by creation date */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Current store version — increment when making breaking schema changes
 */
export const STORE_VERSION = 1;
