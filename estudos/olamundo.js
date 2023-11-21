// olamundo.js
// exercício Node.js
// by geanclm on 17/11/2023

// carrega o módulo http
var http = require("http");
// cria o servidor http
http
    .createServer(function(req, res) {
// cabecalho do conteúdo
    res.writeHead(200, { "content-type": "text/plain" });
// escreve mensagem e sinaliza que a comunicação está completa.
res.end("Ola mundo!\n");
})
.listen(8124);
console.log("Servidor rodando na porta 8124 - acesse no navegador http://127.0.0.1:8124/");