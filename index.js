async function parseDemo(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const buffer = fs.readFileSync(filePath);
            const demo = new DemoFile.DemoFile();
            const rounds = [];
            let mapName = "unknown";

            demo.on("start", () => {
                mapName = demo.header.mapName;
            });

            demo.gameEvents.on("round_start", () => {
                const currentRound = demo.gameRules.roundsPlayed + 1;
                rounds[currentRound] = { id: currentRound, positions: [] };
            });

            // Analisar apenas a cada 256 ticks (reduz o uso de CPU/RAM drasticamente)
            demo.on("tick", () => {
                const currentRound = demo.gameRules.roundsPlayed + 1;
                if (rounds[currentRound] && demo.currentTick % 256 === 0) {
                    demo.players.forEach(p => {
                        if (p && p.isAlive && p.position) {
                            rounds[currentRound].positions.push({ 
                                x: p.position.x, 
                                y: p.position.y, 
                                side: p.side 
                            });
                        }
                    });
                }
            });

            demo.on("end", () => {
                resolve({ map: mapName, rounds: rounds.filter(Boolean) });
            });

            // Erro caso o parser falhe
            demo.on("error", (err) => reject(err));

            demo.parse(buffer);
        } catch (e) {
            reject(e);
        }
    });
}

app.get("/demo/:name", async (req, res) => {
    // Aumentar o tempo limite de resposta para 5 minutos
    req.setTimeout(300000); 
    
    const name = req.params.name;
    const filePath = path.join(UPLOAD_DIR, name);

    if (!fs.existsSync(filePath)) return res.status(404).send("Ficheiro não encontrado");

    try {
        console.log(`A iniciar análise da demo: ${name}`);
        const data = await parseDemo(filePath);
        const analyzed = data.rounds.map(r => analyzeRound(r));
        
        console.log("Análise concluída com sucesso!");
        res.json({ file: name, map: data.map, rounds: analyzed });
    } catch (err) {
        console.error("ERRO NO PARSER:", err);
        res.status(500).json({ error: "O servidor não aguentou processar esta demo." });
    }
});
