const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");

const volumePath = '/data';
const dbFile = path.join(volumePath, 'db.json');
const defaultDbFile = path.join(__dirname, 'db.json');

// Copia db.json inicial al volumen si no existe
if (!fs.existsSync(dbFile) && fs.existsSync(defaultDbFile)) {
  fs.copyFileSync(defaultDbFile, dbFile);
  console.log('Copied default db.json to volume');
}

const server = jsonServer.create();
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults();

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use(jsonServer.rewriter({ '/api/*': '/$1' }));
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('JSON Server running on port', PORT);
});

/* ---------- BACKUP AUTOMÁTICO A GITHUB ---------- */

function autoBackup(){
  exec(`
    git status --porcelain | grep db.json &&
    git add ${dbFile} &&
    git commit -m "Auto backup JSON DB" &&
    git push https://$GITHUB_TOKEN@github.com/DanielFloresTamayo/mi-json-backend.git main
  `, () => {});
}

// cada 5 minutos
setInterval(autoBackup, 1000 * 60 * 5);
