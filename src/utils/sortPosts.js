/**
 * Sorts an array of posts based on the specified sorting criteria
 * Supported sorting options:
 * - "recent": Sorts by most recent posts (default)
 * - "top": Sorts by highest score
 * - "trending": Sorts by a combination of score and recency
 * -  "hot": Sorts by most recent upvote activity
 * 
 * @param {Array} posts - The array of post objects to sort
 * @param {string} sortBy - The sorting criteria ("recent", "top", "trending", "hot")
 * @returns {Array} - The sorted array of posts
 */

export function applyPostSort(posts, sortBy = "recent") {
  const normalizedSort = String(sortBy || "recent").toLowerCase();
  const now = Date.now();
  const getHotTimestamp = (post) => {
    const explicit = new Date(post.lastUpvotedAt || 0).getTime();
    if (!Number.isNaN(explicit) && explicit > 0) return explicit;

    // Keep zero-vote posts visible by falling back to interaction/create timestamps.
    const fallback = new Date(post.lastInteraction || post.createdAt || now).getTime();
    return Number.isNaN(fallback) ? 0 : fallback;
  };

  if (normalizedSort === "top") {
    return posts.sort((a, b) => b.score - a.score);
  }

  if (normalizedSort === "trending") {
    return posts.sort((a, b) => {
      const aTrend = a.score * 1000 + new Date(a.lastInteraction || a.createdAt || now).getTime();
      const bTrend = b.score * 1000 + new Date(b.lastInteraction || b.createdAt || now).getTime();
      return bTrend - aTrend;
    });
  }

  if (normalizedSort === "hot") {
    return posts.sort((a, b) => {
      const aHasVoteTimestamp = getHotTimestamp(a) > 0 && Number(new Date(a.lastUpvotedAt || 0).getTime()) > 0;
      const bHasVoteTimestamp = getHotTimestamp(b) > 0 && Number(new Date(b.lastUpvotedAt || 0).getTime()) > 0;
      if (aHasVoteTimestamp !== bHasVoteTimestamp) {
        return bHasVoteTimestamp ? 1 : -1;
      }

      const timeDiff = getHotTimestamp(b) - getHotTimestamp(a);
      if (timeDiff !== 0) return timeDiff;
      return (Number(b.score) || 0) - (Number(a.score) || 0);
    });
  }

  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
