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