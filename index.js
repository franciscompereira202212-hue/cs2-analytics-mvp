const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

// Aumentar o limite para aguentar demos pesadas de CS2
app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: true // Ativa logs no console do Replit para vermos o progresso
}));

app.use(express.static("public"));

// Garantir que a pasta de uploads existe
const UPLOAD_DIR = "./uploads";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

/* =========================
   UPLOAD COM DEBUG
========================= */
app.post("/upload", (req, res) => {
  console.log("LOG: Recebido pedido de upload...");

  if (!req.files || !req.files.demo) {
    console.error("LOG: Nenhum ficheiro encontrado no upload.");
    return res.status(400).send("Nenhum ficheiro selecionado.");
  }

  const file = req.files.demo;
  const path = `${UPLOAD_DIR}/${file.name}`;

  file.mv(path, (err) => {
    if (err) {
      console.error("LOG: Erro ao mover ficheiro:", err);
      return res.status(500).send(err);
    }
    console.log(`LOG: Upload concluído com sucesso: ${file.name}`);
    res.send("Upload feito!");
  });
});

/* =========================
   LISTAR DEMOS
========================= */
app.get("/demos", (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    res.json(files);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* =========================
   PARSER REAL (Captura de Posições)
========================= */
function parseDemo(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const demo = new DemoFile.DemoFile();
      const rounds = [];

      demo.gameEvents.on("round_start", () => {
        const currentRound = demo.gameRules.roundsPlayed + 1;
        rounds[currentRound] = {
          id: currentRound,
          positions: [],
          utility: false
        };
      });

      // Captura posição a cada segundo (64 ticks)
      demo.on("tick", () => {
        const currentRound = demo.gameRules.roundsPlayed + 1;
        if (rounds[currentRound] && demo.currentTick % 64 === 0) {
          demo.players.forEach(p => {
            if (p && p.isAlive) {
              rounds[currentRound].positions.push({
                x: p.position.x,
                y: p.position.y,
                side: p.side
              });
            }
          });
        }
      });

      demo.on("end", () => resolve(rounds.filter(Boolean)));
      demo.parse(buffer);
    } catch (e) {
      reject(e);
    }
  });
}

/* =========================
   ANÁLISE FINAL
========================= */
app.get("/demo/:name", async (req, res) => {
  const name = req.params.name;
  const path = `${UPLOAD_DIR}/${name}`;

  if (!fs.existsSync(path)) return res.status(404).send("Ficheiro não encontrado");

  try {
    const rounds = await parseDemo(path);
    const analyzedRounds = rounds.map(r => analyzeRound(r));

    res.json({
      file: name,
      verdict: analyzedRounds.filter(r => r.rating === "BAD").length > 4 ? "Tática Fraca" : "Bom Jogo",
      rounds: analyzedRounds
    });
  } catch (err) {
    console.error("LOG: Erro no parser:", err);
    res.status(500).json({ error: "Falha ao processar demo" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nexus Server a correr na porta ${PORT}`));
