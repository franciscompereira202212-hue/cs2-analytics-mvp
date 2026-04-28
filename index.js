const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

app.use(fileUpload());
app.use(express.static("public"));

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.demo) return res.status(400).send("No file uploaded");
  const file = req.files.demo;
  await file.mv("./uploads/" + file.name);
  res.send("Upload feito!");
});

app.get("/demos", (req, res) => {
  res.json(fs.readdirSync("./uploads"));
});

/* =================================================
   PARSER PRO (Captura de Posições para Ghost Coach)
   ================================================= */
function parseDemo(filePath) {
  return new Promise((resolve) => {
    const buffer = fs.readFileSync(filePath);
    const demo = new DemoFile.DemoFile();
    const rounds = [];
    
    // Simulação de base de dados Pro (exemplo simplificado)
    const proPositions = {
      "CT": { x: -1200, y: 500 }, // Posição ideal s1mple
      "T": { x: 1500, y: -200 }
    };

    demo.gameEvents.on("round_start", () => {
      const currentRound = demo.gameRules.roundsPlayed + 1;
      rounds[currentRound] = {
        id: currentRound,
        positions: [],
        voiceCalls: [],
        stats: { utility: 0, trades: 0 }
      };
    });

    // Captura posições a cada tick para o Ghost Coach
    demo.on("tick", () => {
      const currentRound = demo.gameRules.roundsPlayed + 1;
      if (!rounds[currentRound]) return;

      // Só guardamos posição a cada 64 ticks para não sobrecarregar o JSON
      if (demo.currentTick % 64 === 0) {
        demo.players.forEach(p => {
          if (p && p.isAlive) {
            rounds[currentRound].positions.push({
              player: p.name,
              side: p.side,
              x: p.position.x,
              y: p.position.y,
              // Aqui calculamos a distância para o "fantasma" Pro
              distToPro: Math.hypot(p.position.x - proPositions[p.teamNumber === 3 ? "CT" : "T"].x, 
                                    p.position.y - proPositions[p.teamNumber === 3 ? "CT" : "T"].y)
            });
          }
        });
      }
    });

    // Voice AI (Simulado através do chat ou logs de rádio)
    demo.gameEvents.on("player_chat", (e) => {
      const currentRound = demo.gameRules.roundsPlayed + 1;
      if (rounds[currentRound]) {
        rounds[currentRound].voiceCalls.push({ player: e.entity.name, msg: e.text });
      }
    });

    demo.on("end", () => resolve(rounds.filter(Boolean)));
    demo.parse(buffer);
  });
}

/* =========================
   ANALYSIS ENDPOINT
========================= */
app.get("/demo/:name", async (req, res) => {
  const path = "./uploads/" + req.params.name;
  
  try {
    const rawRounds = await parseDemo(path);

    const analyzedRounds = rawRounds.map(r => {
      // Usamos as posições reais para dar o veredito
      const avgDist = r.positions.reduce((acc, p) => acc + p.distToPro, 0) / (r.positions.length || 1);
      
      // Lógica de Ghost Coaching: Se estiver longe do "Pro", o rating baixa
      const ghostRating = avgDist < 500 ? "GOOD" : avgDist < 1000 ? "OK" : "BAD";
      
      const analysis = analyzeRound({ ...r, rating: ghostRating });
      
      return {
        ...r,
        rating: ghostRating,
        verdict: analysis.verdict,
        issues: analysis.issues,
        // Mandamos apenas uma amostra de posições para o frontend não crashar
        mapData: r.positions.slice(-10) 
      };
    });

    res.json({
      file: req.params.name,
      verdict: analyzedRounds.filter(r => r.rating === "BAD").length > 3 ? "Necessita de Melhoria Tática" : "Performance Sólida",
      rounds: analyzedRounds
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar demo" });
  }
});

app.listen(3000, () => console.log("Nexus AI Backend Running on Port 3000"));
