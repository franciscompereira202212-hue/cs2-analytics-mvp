const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const DemoFile = require("demofile");
const { analyzeRound } = require("./coachEngine");

const app = express();

// --- CONFIGURAÇÃO DE LIMITES EXTREMOS ---

// Aumentamos o limite para 1GB (para garantir que 200MB passam a rir)
const MAX_SIZE = 1024 * 1024 * 1024; 

// Middleware de upload configurado ANTES de qualquer outro parser
app.use(fileUpload({
    limits: { fileSize: MAX_SIZE },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    parseNested: true,
    debug: true // Ativa isto para vermos logs detalhados no console do Replit
}));

// Parsers normais com limites altos
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ limit: '1024mb', extended: true }));

app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* =========================
   ROTA DE UPLOAD (REFEITA)
========================= */
app.post("/upload", (req, res) => {
    console.log("--- INÍCIO DO RECEBIMENTO ---");
    
    if (!req.files || !req.files.demo) {
        console.error("ERRO: Ficheiro não encontrado no request.");
        return res.status(400).send("Ficheiro vazio.");
    }

    const demoFile = req.files.demo;
    const savePath = path.join(UPLOAD_DIR, demoFile.name);

    console.log(`Recebendo: ${demoFile.name} | Tamanho: ${(demoFile.size / 1024 / 1024).toFixed(2)}MB`);

    demoFile.mv(savePath, (err) => {
        if (err) {
            console.error("ERRO AO MOVER:", err);
            return res.status(500).send("Erro ao gravar no disco.");
        }
        console.log("SUCESSO: Ficheiro guardado!");
        res.status(200).send("OK");
    });
});

/* =========================
   RESTO DO MOTOR (IGUAL)
========================= */
app.get("/demos", (req, res) => {
    try {
        const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.dem'));
        res.json(files);
    } catch (e) { res.json([]); }
});

// Teu parser de demo aqui... (mantém o que tinhas ou usa o das respostas anteriores)

app.listen(3000, '0.0.0.0', () => {
    console.log("🚀 SERVER NEXUS ATIVO | LIMITE: 1GB");
});
