const fs = require("fs");

async function parseDemo(filePath) {
    return new Promise((resolve, reject) => {
        // Criamos um stream de leitura em vez de ler o buffer todo
        const stream = fs.createReadStream(filePath);
        const demo = new DemoFile.DemoFile();
        const rounds = [];
        let mapName = "unknown";

        demo.on("start", () => {
            mapName = demo.header.mapName;
            console.log("Mapa detetado:", mapName);
        });

        demo.gameEvents.on("round_start", () => {
            const currentRound = demo.gameRules.roundsPlayed + 1;
            rounds[currentRound] = { id: currentRound, positions: [] };
        });

        // Analisar apenas a cada 512 ticks (redução extrema de uso de recursos)
        demo.on("tick", () => {
            const currentRound = demo.gameRules.roundsPlayed + 1;
            if (rounds[currentRound] && demo.currentTick % 512 === 0) {
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
            console.log("Fim do parsing.");
            resolve({ map: mapName, rounds: rounds.filter(Boolean) });
        });

        demo.on("error", (err) => {
            console.error("Erro no parser:", err);
            reject(err);
        });

        // Iniciar o parsing através do stream
        demo.parseStream(stream);
    });
}

app.get("/demo/:name", async (req, res) => {
    const name = req.params.name;
    const filePath = path.join(UPLOAD_DIR, name);

    if (!fs.existsSync(filePath)) return res.status(404).send("Ficheiro não encontrado");

    try {
        console.log(`--- ANALISANDO EM MODO STREAM: ${name} ---`);
        const data = await parseDemo(filePath);
        
        // Se a demo for muito grande, mandamos apenas os primeiros 15 rounds para não dar erro de resposta
        const limitedRounds = data.rounds.slice(0, 15).map(r => analyzeRound(r));
        
        res.json({ 
            file: name, 
            map: data.map, 
            rounds: limitedRounds 
        });
    } catch (err) {
        console.error("CRASH NO SERVIDOR:", err);
        res.status(500).json({ error: "A demo é demasiado pesada para o Replit Free." });
    }
});
