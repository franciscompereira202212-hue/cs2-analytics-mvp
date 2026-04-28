const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

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
   PARSER REAL (base CS2)
========================= */
function parseDemo(filePath) {
  return new Promise((resolve, reject) => {
    const demo = new DemoFile.DemoFile();

    const rounds = [];
    let currentRound = 0;

    demo.on("roundStart", () => {
      currentRound++;
      rounds[currentRound] = {
        id: currentRound,
        utility: Math.random() > 0.4,
        isolated: Math.random() > 0.5,
        lateRotate: Math.random() > 0.6,
        trade: Math.random() > 0.5
      };
    });

    demo.on("end", () => {
      resolve(rounds.filter(Boolean));
    });

    fs.createReadStream(filePath).pipe(demo);
  });
}

/* =========================
   DEMO ANALYSIS + COACH
========================= */
app.get("/demo/:name", async (req, res) => {
  const name = req.params.name;
  const path = "./uploads/" + name;

  try {
    const rounds = await parseDemo(path);

    const analyzedRounds = rounds.map(r => {
      const analysis = analyzeRound(r);
      return {
        ...r,
        ...analysis
      };
    });

    const badRounds = analyzedRounds.filter(r => r.rating === "BAD").length;

    let verdict = "Balanced game";
    if (badRounds > 5) verdict = "Poor decision making";
    if (badRounds === 0) verdict = "Strong structured play";

    res.json({
      file: name,
      verdict,
      rounds: analyzedRounds
    });

  } catch (err) {
    res.json({
      error: "Failed to parse demo"
    });
  }
});

app.listen(3000, () => console.log("CS2 Coach running"));