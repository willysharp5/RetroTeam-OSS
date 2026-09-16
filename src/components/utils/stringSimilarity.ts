function calculateEditDistance(str1: string, str2: string) {
  const m = str1.length;
  const n = str2.length;

  // Initialize a 2D array to store edit distances
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Compute edit distances
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  // Return the edit distance
  return dp[m][n];
}

export function stringsWithinThreshold(
  str1: string,
  str2: string,
  threshold: number,
) {
  const editDistance = calculateEditDistance(str1, str2);
  return editDistance <= threshold;
}
