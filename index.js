const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const DemoFile = require("demofile");

const app = express();

app.use(fileUpload());
app.use(express.static("public"));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

/* =========================
   UPLOAD DEMO
========================= */
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.demo) {
    return res.send("No file uploaded");
  }

  const file = req.files.demo;
  const path = "./uploads/" + file.name;

  await file.mv(path);

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
   🔥 REAL DEMO PARSER
========================= */
function parseDemo(filePath) {
  return new Promise((resolve, reject) => {
    const demo = new DemoFile.DemoFile();

    const stats = {
      rounds: 0,
      kills: 0,
      deaths: 0,
      assists: 0
    };

    demo.on("matchStart", () => {
      stats.rounds = 0;
    });

    demo.on("roundEnd", () => {
      stats.rounds++;
    });

    demo.on("playerDeath", (e) => {
      stats.deaths++;
    });

    demo.on("playerKilled", (e) => {
      stats.kills++;
    });

    const stream = fs.createReadStream(filePath);

    demo.parseStream(stream)
      .on("end", () => resolve(stats))
      .on("error", reject);
  });
}

/* =========================
   DEMO ANALYSIS REAL
========================= */
app.get("/demo/:name", async (req, res) => {
  const name = req.params.name;
  const path = "./uploads/" + name;

  try {
    const stats = await parseDemo(path);

    // coach layer em cima de dados reais
    let verdict = "Balanced game";

    if (stats.kills > stats.deaths + 10) verdict = "Strong fragging performance";
    if (stats.deaths > stats.kills) verdict = "Poor survival decisions";

    res.json({
      file: name,
      stats,
      coachVerdict: verdict
    });

  } catch (err) {
    res.json({
      error: "Failed to parse demo (file may not be valid CS2 demo yet)"
    });
  }
});

app.listen(3000, () => console.log("CS2 parser running"));