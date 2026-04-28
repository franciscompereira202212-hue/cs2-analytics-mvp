const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");

const app = express();
app.use(fileUpload());
app.use(express.static("public"));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Upload
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.demo) {
    return res.send("No file uploaded");
  }

  const file = req.files.demo;
  await file.mv("./uploads/" + file.name);

  res.send("Upload feito!");
});

// 🔥 NOVO: listar demos
app.get("/demos", (req, res) => {
  const files = fs.readdirSync("./uploads");
  res.json(files);
});

app.listen(3000, () => console.log("Servidor ligado"));

// 🔥 análise fake de demo
app.get("/demo/:name", (req, res) => {
  const name = req.params.name;

  res.json({
    file: name,
    rounds: Math.floor(Math.random() * 30),
    kills: Math.floor(Math.random() * 25),
    deaths: Math.floor(Math.random() * 20),
    mistakes: [
      "Late rotation",
      "No flash entry",
      "Bad positioning"
    ]
  });
});