function analyzeRound(roundData) {
    const positions = roundData.positions || [];
    let rating = "GOOD";
    let suggestions = [];

    // Lógica simples de exemplo: Verifica se houve muita dispersão
    if (positions.length > 0) {
        const ctPlayers = positions.filter(p => p.side === 3);
        if (ctPlayers.length < 2) {
            rating = "BAD";
            suggestions.push("A equipa estava demasiado separada. Tenta jogar em duplas.");
        } else {
            suggestions.push("Bom posicionamento defensivo. Cruzamento de mira detetado.");
        }
    }

    return {
        id: roundData.id,
        rating: rating,
        suggestions: suggestions,
        mapData: positions
    };
}

module.exports = { analyzeRound };
