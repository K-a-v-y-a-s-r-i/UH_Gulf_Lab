// Colors by confidence_count (how many independent detection methods
// flagged a parcel). Higher confidence = stronger, more corroborated signal.
export const CONFIDENCE_COLORS = {
  low: '#cccccc',    // confidence_count 1 — resale only, weak signal
  medium: '#f59e0b', // confidence_count 2
  high: '#dc2626',   // confidence_count 3 or more
};

export function colorForConfidence(count) {
  if (count >= 3) return CONFIDENCE_COLORS.high;
  if (count === 2) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
}