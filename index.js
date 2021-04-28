const WebSocket = require('ws')
const https = require('https');
const fs = require('fs');
const RoomsController = require('./rooms-controller');
const roomsController = new RoomsController.RoomsController();
const GameController = require('./game-controller');
const gameController = new GameController.GameController();
const allClients = new Set();
const server = https.createServer({
  key: fs.readFileSync("/etc/letsencrypt/live/wt143.fei.stuba.sk/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/wt143.fei.stuba.sk/fullchain.pem")
});

server.listen(9000);
const wss = new WebSocket.Server({
  server: server
});

//QkyV64C#$OwFbM
function connect() {
  wss.on('connection', (client, req) => {
    client.on('message', async (message) => {
      await onMessage(message, client);
    });
    client.send(JSON.stringify({data: roomsController.clients, type: 'connected'}));
    allClients.add(client);
  })

}

connect();


async function onMessage(message, client) {
  const response = JSON.parse(message);
  if (response.type === 'createRoom') {
    const room = roomsController.createRoom(client, response.data);
    const data = JSON.stringify({data: room, type: 'allPlayers'});
    client.send(data);
  }
  if (response.type === 'allPlayers') {
    const room = roomsController.getRoomById(response.data);
    const data = JSON.stringify({data: room, type: 'allPlayers'});
    client.send(data);
  }
  if (response.type === 'addPlayerToRoom') {
    roomsController.addPlayerToRoom(response.data.id, client, response.data.player);
    const room = roomsController.getRoomById(response.data.id);
    const data = JSON.stringify({data: room, type: 'allPlayers'});
    await roomsController.sendToAllClientsInRoom(data, response.data.id);
  }
  if (response.type === 'canConnect') {
    const cannConnect = roomsController.canConnectToRoom(response.data);
    if (cannConnect) {
      const data = JSON.stringify({data: true, type: 'canConnect'});
      client.send(data);
    } else {
      const data = JSON.stringify({data: false, type: 'canConnect'});
      client.send(data);
    }
  }
  if (response.type === 'disableRoomConnection') {
    roomsController.disableConnectToRoom(response.data);
  }
  if (response.type === 'settings') {
    const room = roomsController.getRoomById(response.data.roomId);
    if (response.data.settings.rounds) {
      room.game.rounds = response.data.settings.rounds;
    }
    if (response.data.settings.limitInSeconds) {
      room.game.limitInSeconds = response.data.settings.limitInSeconds;
    }
  }
  if (response.type === 'startGame') {
    const data = JSON.stringify({data: true, type: 'startGame'});
    await roomsController.sendToAllClientsInRoom(data, response.data);
    await roomsController.startGameInRoom(response.data);
  }

  if (response.type === 'sendMessage') {
    const message = response.data.content;
    const words = response.data.words;
    const roomId = response.data.id;
    const playerId = response.data.playerId;
    const data = JSON.stringify({data: message, type: 'receivedMessage'});
    if (roomsController.correctWords(words, roomId)) {
      roomsController.countPoints(roomId, playerId);
      roomsController.getPlayerById(roomId, playerId).correctRound = true;
      const data = JSON.stringify({data: true, type: 'correctWords'});
      client.send(data);
      return;
    }
    await roomsController.sendToAllClientsInRoom(data, roomId);
  }
  if (response.type === 'canvasState') {
    const data = JSON.stringify({
      data: {canvas: response.data.canvas},
      type: 'canvasUpdate'
    });
    await roomsController.sendToAllClientsInRoom(data, response.data.roomId);
  }

  if (response.type === 'canvasBackground') {
    const data = JSON.stringify({
      data: {backgroundColor: response.data.backgroundColor},
      type: 'canvasUpdateBackground'
    });
    await roomsController.sendToAllClientsInRoom(data, response.data.roomId);
  }
}
