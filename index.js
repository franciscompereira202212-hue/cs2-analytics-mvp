const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

// Configuração para aceitar demos grandes (até 200MB)
app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true
}));

app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Rota de Upload
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.demo) return res.status(400).send("Ficheiro não encontrado.");
    const file = req.files.demo;
    const savePath = path.join(UPLOAD_DIR, file.name);
    
    file.mv(savePath, (err) => {
        if (err) return res.status(500).send(err);
        res.send("Upload completo!");
    });
});

// Lista todas as demos
app.get("/demos", (req, res) => {
    res.json(fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.dem')));
});

// Parser de Demo com deteção de Mapa
function parseDemo(filePath) {
    return new Promise((resolve, reject) => {
        const buffer = fs.readFileSync(filePath);
        const demo = new DemoFile.DemoFile();
        const rounds = [];
        let mapName = "unknown";

        demo.on("start", () => { mapName = demo.header.mapName; });

        demo.gameEvents.on("round_start", () => {
            const currentRound = demo.gameRules.roundsPlayed + 1;
            rounds[currentRound] = { id: currentRound, positions: [] };
        });

        demo.on("tick", () => {
            const currentRound = demo.gameRules.roundsPlayed + 1;
            if (rounds[currentRound] && demo.currentTick % 128 === 0) { // Analisa a cada 2 seg para poupar CPU
                demo.players.forEach(p => {
                    if (p && p.isAlive) {
                        rounds[currentRound].positions.push({ x: p.position.x, y: p.position.y, side: p.side });
                    }
                });
            }
        });

        demo.on("end", () => resolve({ map: mapName, rounds: rounds.filter(Boolean) }));
        demo.parse(buffer);
    });
}

app.get("/demo/:name", async (req, res) => {
    try {
        const data = await parseDemo(path.join(UPLOAD_DIR, req.params.name));
        const analyzed = data.rounds.map(r => analyzeRound(r));
        res.json({ file: req.params.name, map: data.map, rounds: analyzed });
    } catch (err) {
        res.status(500).json({ error: "Erro ao processar." });
    }
});

app.listen(3000, '0.0.0.0', () => console.log("🚀 Nexus Server Online na Porta 3000"));
