'use strict';

var webSocket;
var roomNumber; // of type string
var msg;


var getRoomButton;
var joinRoomButton;
var getmsg;
var sendmsg;
var getmsgButton;
var sendmsgButton;
var msgArea;

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: true
};

function handleSuccess(stream) {
  const video = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

function init(e) {
  navigator.mediaDevices.getUserMedia(constraints).then(function(s) {
    console.log("getUserMedia succeeds");
    handleSuccess(s);
    e.target.disabled = true;
  }).catch(function(err) {
    console.log("getUserMedia fails");
    handleError(e);
  });
}

function DisplayAndHiddenBtn(btnId, type) {
    var currentBtn = document.getElementById(btnId);
    if (type == "d") {
        currentBtn.style.display = "block"; 
    }
    else if (type == "h") {
        currentBtn.style.display = "none";
    }
}

function createWebSocket() {
   console.log("create websocket");
   webSocket = new WebSocket("wss://www.antuo.me");
   webSocket.onopen = function(evt) { onWebSocketOpen(evt) };
   webSocket.onclose = function(evt) { onWebSocketClose(evt) };
   webSocket.onmessage = function(evt) { onWebSocketMessage(evt) };
   webSocket.onerror = function(evt) { onWebSocketError(evt) };
}

function onWebSocketOpen(evt) {
    console.log("onWebSocketOpen, roomNumber:" + roomNumber);
    if (!roomNumber) {
        var getRoom = {msg_type : "get_room"};
  console.log('>> getroom:' + JSON.stringify(getRoom));
       
        webSocket.send(JSON.stringify(getRoom));
    } else {
  var joinRoom = {msg_type : "join_room",
                  room_number : roomNumber,
                   msg : msgArea.value};
  console.log('>> joinroom:' + JSON.stringify(joinRoom));
     DisplayAndHiddenBtn("getRoom","h");
  webSocket.send(JSON.stringify(joinRoom));
    }
}

function onWebSocketClose(evt) {
    var room=websocketToRoom.get(ws);
    roomToWebsocket.delete(room);
    websocketToRoom.delete(ws);
    console.log("onWebSocketClose");
    webSocket = null;
}

function onWebSocketMessage(evt) {
    console.log("<< onWebSocketMessage:" + evt.data);
    var response = JSON.parse(evt.data);
    switch (response.msg_type) {
  case "get_room":
            roomNumber = response.room_number;
            console.log("room is:" + roomNumber);
            DisplayAndHiddenBtn("getRoom", "h");
        break;
        case "message":
            var msg = response.msg;
            writeToScreen('<span style="color: blue;">RESPONSE: ' + msg +'</span>');            
            console.log("msg is:" + msg);
//            msg.innerHTML = msgArea.value;
        break;
    }
}

function onWebSocketError(evt) {
    console.log("onWebSocketError:" + evt.data);
}
   
getRoomButton = document.getElementById('getRoom');

getmsgButton = document.getElementById('getmsg');
sendmsgButton = document.getElementById('sendmsg');
msgArea = document.getElementById('msg');

getRoomButton.addEventListener('click', function() {
    createWebSocket();
});

sendmsgButton.addEventListener('click', function() {
    var send = {msg_type : 'message',
          room_number : roomNumber,
          msg : msgArea.value};
    console.log(">> sendMsg:" + JSON.stringify(send));
    webSocket.send(JSON.stringify(send));
    msgArea.value = "";
});

function onLoad() {
    console.log("OnLoad, window.pathname:" + location.pathname);
    var path = location.pathname;
    if (path.split('/').length == 3) {
        roomNumber = parseInt(path.split('/')[2]);
        console.log("room number is:" + roomNumber);
  getRoomButton.innerText = "Join Room " + roomNumber;

    }
}

 function writeToScreen(message)
  {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
  }

function joinRoom(roomNumber) {
   createWebSocket(); 
}



document.querySelector('#showVideo').addEventListener('click', e => init(e));
