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

var nextRoom = 1000;

var roomToWebSockets = new Map();
var websocketToRoom = new Map();

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

app.get('/', function(req, res){ 
  if (!req.secure)
    res.redirect("https://" + req.headers.host + req.url);
  else
    res.sendFile(__dirname + '/index.html');
});

app.get('/r/:roomId', function(req, res){ 
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
  ws.on('close', function onClose(ws) { onWebSocketClose(ws); });
  ws.on('message', function onMessage(message) { onWebSocketMessage(ws, message); });
});

function onWebSocketMessage(ws, message) {
   console.log('onWebSocketMessage:' + message);
   var msg = JSON.parse(message);
   switch(msg.msg_type) {
     case 'get_room':
         var websockets = [];
         websockets.push(ws);
         roomToWebSockets.set(nextRoom, websockets);
         websocketToRoom.set(ws,room);
         var response = {msg_type : 'get_room',
		         room_number : nextRoom};
         nextRoom++;
         ws.send(JSON.stringify(response));
     break;
     case 'join_room':
         var room = msg.room_number;
         console.log('join room:' + room + ',roomToWebSockets:' + roomToWebSockets + ',message' + msg);
         var sockets = roomToWebSockets.get(room);
         console.log('sockets:' + sockets);
         sockets.push(ws);
     break;
     case 'message':
         var room = msg.room_number;
         var peerSocket = getPeerSocket(room, ws);
	 if (peerSocket)
             peerSocket.send(message);
     break;
   }
}

function onWebSocketClose(ws) {
	var room = websocketToRoom.get(ws);
	roomToWebSockets.delete(room);
	websocketToRoom.delete(ws);
   console.log('onWebSocketClose:');
}

function getPeerSocket(room, ws) {
    if (ws.peer)
        return;
    var sockets = roomToWebSockets.get(room);
    if (sockets && sockets.length == 2) {
       if (sockets[0] == ws) {
	  ws.peer= sockets[1];
	  sockets[1].peer = ws;
          return sockets[1];
       }
       else if (sockets[1] == ws) {
	  ws.peer = socket[0];
	  socket[0].peer = ws;
	  return sockets[0]
       }
       else return null;
    }
    return null;
}
//setInterval(() => {
//  wss.clients.forEach((client) => {
//    client.send(new Date().toTimeString());
//  });
//}, 1000);
