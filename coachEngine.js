/**
 * Nexus.gg AI Engine - Logic for Ghost Coaching & Voice Analysis
 */

function analyzeRound(round) {
  const issues = [];
  const suggestions = [];
  
  // 1. Lógica de Ghost Coaching (Posicionamento)
  // O backend agora passa o 'rating' baseado na distância para o Pro
  if (round.rating === "BAD") {
    issues.push("Poor Spatial Positioning (Ghost Sync Low)");
    suggestions.push("O teu 'Fantasma' sugere que recues 200 unidades para o cover.");
  } else if (round.rating === "OK") {
    issues.push("Sub-optimal Angle");
    suggestions.push("Estás quase na posição certa, mas o Pro Player seguraria um ângulo mais fechado.");
  }

  // 2. Análise de Utilitários (Utility Usage)
  if (!round.utility) {
    issues.push("Dry Peek detected");
    suggestions.push("Nesta situação, um Pro usaria uma 'Pop Flash' antes de abrir.");
  }

  // 3. Voice AI Analysis (Simulação de Calls)
  // Se houver voiceCalls na demo, analisamos a qualidade
  if (round.voiceCalls && round.voiceCalls.length === 0) {
    issues.push("Silence during contact");
    suggestions.push("A IA notou falta de comunicação. Dá a call da tua posição ao morrer.");
  } else if (round.voiceCalls && round.voiceCalls.some(v => v.msg.length > 50)) {
    issues.push("Cluttered Comms");
    suggestions.push("As tuas calls estão demasiado longas. Sê mais conciso como um IGL Pro.");
  }

  // 4. Lógica de Trade & Teamplay
  if (round.isolated && !round.trade) {
    issues.push("No Refrag Potential");
    suggestions.push("Morreste isolado. Espera pelo teu colega para garantir o trade-kill.");
  }

  // Cálculo de Rating Final Combinado
  let finalRating = round.rating; // Começa com o rating de posição do parser
  
  const penaltyCount = issues.length;
  
  if (penaltyCount >= 4) finalRating = "BAD";
  else if (penaltyCount >= 2) finalRating = "OK";
  else if (penaltyCount === 0) finalRating = "GOOD";

  return {
    rating: finalRating,
    issues,
    suggestions,
    ghostData: {
      syncPercentage: finalRating === "GOOD" ? 95 : finalRating === "OK" ? 70 : 40,
      proName: "s1mple" // Aqui poderias tornar dinâmico
    }
  };
}

module.exports = { analyzeRound };
