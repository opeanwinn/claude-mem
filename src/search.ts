import { Memory } from './index';

/**
 * Search options for filtering memories
 */
export interface SearchOptions {
  /** Case-sensitive search (default: false) */
  caseSensitive?: boolean;
  /** Maximum number of results to return */
  limit?: number;
  /** Filter by tags */
  tags?: string[];
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  memory: Memory;
  /** Simple relevance score based on match frequency */
  score: number;
}

/**
 * Search memories by query string using basic keyword matching.
 * Searches across content and tags.
 */
export function searchMemories(
  memories: Memory[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { caseSensitive = false, limit, tags } = options;

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const keywords = normalizedQuery.split(/\s+/).filter(Boolean);

  if (keywords.length === 0) {
    return memories.map((memory) => ({ memory, score: 0 }));
  }

  let results: SearchResult[] = [];

  for (const memory of memories) {
    // Filter by tags if specified
    if (tags && tags.length > 0) {
      const memoryTags = memory.tags ?? [];
      const hasAllTags = tags.every((tag) => memoryTags.includes(tag));
      if (!hasAllTags) continue;
    }

    const content = caseSensitive
      ? memory.content
      : memory.content.toLowerCase();

    const memoryTags = (memory.tags ?? []).map((t) =>
      caseSensitive ? t : t.toLowerCase()
    );

    let score = 0;

    for (const keyword of keywords) {
      // Count occurrences in content
      const contentMatches = countOccurrences(content, keyword);
      score += contentMatches * 2; // Weight content matches higher

      // Check tag matches
      const tagMatches = memoryTags.filter((tag) => tag.includes(keyword)).length;
      score += tagMatches * 3; // Weight tag matches highest
    }

    if (score > 0) {
      results.push({ memory, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  if (limit !== undefined && limit > 0) {
    results = results.slice(0, limit);
  }

  return results;
}

/**
 * Count non-overlapping occurrences of a substring
 */
function countOccurrences(text: string, substring: string): number {
  if (!substring) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(substring, pos)) !== -1) {
    count++;
    pos += substring.length;
  }
  return count;
}

/**
 * Filter memories by one or more tags (AND logic)
 */
export function filterByTags(memories: Memory[], tags: string[]): Memory[] {
  if (tags.length === 0) return memories;
  return memories.filter((memory) => {
    const memoryTags = memory.tags ?? [];
    return tags.every((tag) => memoryTags.includes(tag));
  });
}
