function analyzeRound(round) {
  const issues = [];
  const suggestions = [];

  if (round.isolated) {
    issues.push("Isolated death");
    suggestions.push("Play closer to teammate for trade");
  }

  if (!round.utility) {
    issues.push("No utility used");
    suggestions.push("Use smoke/flash before contact");
  }

  if (round.lateRotate) {
    issues.push("Late rotation");
    suggestions.push("Rotate earlier based on info");
  }

  if (!round.trade) {
    issues.push("No trade setup");
    suggestions.push("Play crossfire positions with teammate");
  }

  let rating = "OK";
  if (issues.length === 0) rating = "GOOD";
  if (issues.length >= 3) rating = "BAD";

  return {
    rating,
    issues,
    suggestions
  };
}

module.exports = { analyzeRound };