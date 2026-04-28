const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

// 1. CONFIGURAÇÃO DE LIMITES (CRÍTICO)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    useTempFiles: true,
    tempFileDir: '/tmp/',
    abortOnLimit: true,
    createParentPath: true,
    debug: true // Isto vai mostrar o progresso no console do Replit
}));

app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 2. ROTA DE UPLOAD REFEITA
app.post("/upload", (req, res) => {
    console.log("--- NOVO PEDIDO DE UPLOAD ---");
    
    if (!req.files || Object.keys(req.files).length === 0) {
        console.error("Nenhum ficheiro recebido.");
        return res.status(400).send("Nenhum ficheiro selecionado.");
    }

    const demoFile = req.files.demo;
    const savePath = path.join(UPLOAD_DIR, demoFile.name);

    console.log(`A guardar: ${demoFile.name} (${(demoFile.size / 1024 / 1024).toFixed(2)} MB)`);

    demoFile.mv(savePath, (err) => {
        if (err) {
            console.error("Erro ao mover ficheiro:", err);
            return res.status(500).send(err);
        }
        console.log("Upload guardado com sucesso!");
        res.status(200).send("Upload completo");
    });
});

// As restantes rotas (/demos e /demo/:name) continuam iguais...
app.get("/demos", (req, res) => {
    const files = fs.readdirSync(UPLOAD_DIR);
    res.json(files);
});

// Mantém o teu parser aqui em baixo como estava...
app.listen(3000, '0.0.0.0', () => {
    console.log("✅ SERVIDOR ATIVO: Porta 3000");
});
