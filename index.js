const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

// 1. CONFIGURAÇÃO CRÍTICA: O fileUpload tem de vir ANTES de tudo
app.use(fileUpload({
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    debug: true
}));

// 2. Aumentar limites do Express para dados textuais
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Rota de Upload
app.post("/upload", (req, res) => {
    console.log("LOG: Tentativa de upload recebida...");
    
    if (!req.files || !req.files.demo) {
        console.log("LOG: Ficheiro não encontrado no request.");
        return res.status(400).send("Ficheiro não enviado.");
    }

    const demoFile = req.files.demo;
    const savePath = path.join(UPLOAD_DIR, demoFile.name);

    demoFile.mv(savePath, (err) => {
        if (err) {
            console.error("LOG: Erro ao mover ficheiro:", err);
            return res.status(500).send(err);
        }
        console.log("LOG: Upload guardado em " + savePath);
        res.status(200).send("OK");
    });
});

app.get("/demos", (req, res) => {
    const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.dem'));
    res.json(files);
});

// Mantém o resto do teu código (app.get("/demo/:name") e app.listen...) abaixo daqui
app.listen(3000, '0.0.0.0', () => {
    console.log("🚀 NEXUS ENGINE: Online e com limites expandidos.");
});
