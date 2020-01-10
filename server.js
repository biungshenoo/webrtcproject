'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const WebSocket = require('ws');

const PORT = process.env.PORT || 80;
const INDEX = '/index.html';

const app = express();

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/www.antuo.me/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/www.antuo.me/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/www.antuo.me/chain.pem', 'utf8');

const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
};


const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

app.get('/', function(req, res){ 
  if (!req.secure)
    res.redirect("https://" + req.headers.host + req.url);
  else
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});

//const server = express()
//  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server: httpsServer });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);
