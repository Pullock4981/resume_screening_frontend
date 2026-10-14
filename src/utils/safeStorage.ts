/**
 * Safe LocalStorage Utility to prevent QuotaExceededError when storing large batch histories
 */
export function safeSaveToLocalStorage(key: string, data: any, maxItems = 25): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      try {
        if (Array.isArray(data)) {
          // Keep only the most recent items
          const trimmed = data.slice(0, Math.min(data.length, maxItems));
          // Strip heavy nested candidate/results arrays if payload is still too large
          const compact = trimmed.map(item => {
            if (!item || typeof item !== 'object') return item;
            const copy = { ...item };
            if (Array.isArray(copy.candidates) && copy.candidates.length > 25) {
              copy.candidates = copy.candidates.slice(0, 25);
            }
            if (Array.isArray(copy.results) && copy.results.length > 25) {
              copy.results = copy.results.slice(0, 25);
            }
            return copy;
          });
          localStorage.setItem(key, JSON.stringify(compact));
          return true;
        }
      } catch (retryErr: any) {
        // Fallback: Store ultra-compact metadata summaries
        try {
          if (Array.isArray(data)) {
            const ultraCompact = data.slice(0, 15).map(item => {
              if (!item || typeof item !== 'object') return item;
              return {
                id: item.id,
                operationName: item.operationName || item.title || 'Screening Batch',
                timestamp: item.timestamp,
                dateFormatted: item.dateFormatted,
                studentSheetUrl: item.studentSheetUrl,
                totalCandidates: item.totalCandidates || (item.candidates ? item.candidates.length : 0),
                excellentCount: item.excellentCount,
                strongCount: item.strongCount,
                moderateCount: item.moderateCount,
                needsImprovementCount: item.needsImprovementCount
              };
            });
            localStorage.setItem(key, JSON.stringify(ultraCompact));
            return true;
          }
        } catch (finalErr) {
          console.warn(`LocalStorage quota exceeded for key '${key}'. Operating in memory.`);
          return false;
        }
      }
    }
    console.warn(`Failed to save to localStorage (${key}):`, e.message || e);
    return false;
  }
}
