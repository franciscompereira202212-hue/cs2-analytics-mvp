const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");

const app = express();

app.use(fileUpload());
app.use(express.static("public"));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

/* =========================
   UPLOAD
========================= */
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.demo) {
    return res.send("No file uploaded");
  }

  const file = req.files.demo;
  await file.mv("./uploads/" + file.name);

  res.send("Upload feito!");
});

/* =========================
   LIST DEMOS
========================= */
app.get("/demos", (req, res) => {
  const files = fs.readdirSync("./uploads");
  res.json(files);
});

/* =========================
   🔥 COACH ENGINE v1
========================= */
function analyzeRound(round) {
  const mistakes = [];

  if (!round.hasUtility) mistakes.push("No utility used in execute");
  if (round.rotateTime > 6) mistakes.push("Late rotation");
  if (!round.tradedKills) mistakes.push("No trade setups");
  if (round.peeksDry) mistakes.push("Dry peeks without info");
  if (round.weakPostPlant) mistakes.push("Poor post-plant positioning");

  let rating = "OK";
  if (mistakes.length >= 3) rating = "BAD";
  if (mistakes.length === 0) rating = "GOOD";

  return {
    round: round.id,
    rating,
    mistakes
  };
}

/* =========================
   DEMO ANALYSIS (SIMULATED)
========================= */
app.get("/demo/:name", (req, res) => {
  const name = req.params.name;

  // 🔥 simulação de rounds (substitui isto por parser real depois)
  const rounds = [];

  for (let i = 1; i <= 12; i++) {
    rounds.push(analyzeRound({
      id: i,
      hasUtility: Math.random() > 0.4,
      rotateTime: Math.floor(Math.random() * 10),
      tradedKills: Math.random() > 0.5,
      peeksDry: Math.random() > 0.6,
      weakPostPlant: Math.random() > 0.5
    }));
  }

  // resumo coach
  const totalMistakes = rounds.reduce((acc, r) => acc + r.mistakes.length, 0);

  let coachVerdict = "Balanced game";
  if (totalMistakes > 20) coachVerdict = "Poor decision making";
  if (totalMistakes < 10) coachVerdict = "Strong structured play";

  res.json({
    file: name,
    coachVerdict,
    rounds
  });
});

app.listen(3000, () => console.log("Server running"));