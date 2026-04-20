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

      // Check tag matches - exact tag match scores higher than partial
      const exactTagMatches = memoryTags.filter((tag) => tag === keyword).length;
      const partialTagMatches = memoryTags.filter((tag) => tag !== keyword && tag.includes(keyword)).length;
      score += exactTagMatches * 5; // Exact tag matches score highest
      score += partialTagMatches * 3; // Partial tag matches still weighted high
    }

    // Also boost score slightly for more recent memories (newer = higher index assumed)
    // This gives a small tiebreaker preference to recently added memories
    if (score > 0) {
      results.push({ memory, score });
    }
  }

  // Sort by score descending, using createdAt as a tiebreaker for equal scores
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.memory.createdAt).getTime() - new Date(a.memory.createdAt).getTime();
  });

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
    // Advance by substring length to avoid overlapping matches
    pos += substring.length;
  }
  return count;
}
