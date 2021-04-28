const Game = require('./game');
const GameController = require('./game-controller');
const gameController = new GameController.GameController();

class RoomsController {


  constructor() {
    this.rooms = [];
    this.clients = [];
  }

  generateId(length) {
    let result = [];
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
  }

  createRoom(client, player) {
    const roomId = this.generateId(8);
    const players = [];
    players.push(player);
    const game = new Game.Game();
    const room = {
      id: roomId, players, game, canConnect: true
    };
    this.rooms.push(room);
    this.clients.push({client, player, roomId});
    return room;
  }

  addPlayerToRoom(roomId, client, player) {
    const roomIndex = this.getRoomIndexById(roomId);
    this.clients.push({client, player, roomId});
    if (this.rooms[roomIndex]) {
      this.rooms[roomIndex].players.push(player);
    }
  }

  sendToDrawer(roomId, data, type) {
    const drawer = this.getDrawer(roomId);
    const dataSend = JSON.stringify({data, type});
    this.getClientByPlayerId(drawer.id).send(dataSend);
    const dataId = JSON.stringify({data: drawer.id, type: 'drawerId'});
    this.sendToAllClientsInRoom(dataId, roomId)
  }

  getClientByPlayerId(playerId) {
    const index = this.clients.findIndex(client => client.player.id === playerId);
    return this.clients[index].client;
  }


  changeDrawTokenToPlayerInRoom(playerId, roomId) {
    const room = this.getRoomById(roomId);
    room.players.forEach((player) => {
      player.drawer = player.id === playerId;
    })
  }

  getDrawer(roomId) {
    const room = this.getRoomById(roomId);
    let drawer = null;
    room.players.forEach((player) => {
      if (player.drawer === true) {
        drawer = player;
      }
    })
    return drawer;
  }

  getPlayerIndex(roomId, playerId) {
    const room = this.getRoomById(roomId);
    return room.players.findIndex(player => player.id === playerId);
  }

  getPlayerById(roomId, playerId) {
    const room = this.getRoomById(roomId);
    const playerIndex = this.getPlayerIndex(roomId, playerId);
    return room.players[playerIndex];
  }

  moveTokenToNextPlayer(roomId, game) {
    const room = this.getRoomById(roomId);
    const drawer = this.getDrawer(roomId);
    let index = this.getPlayerIndex(roomId, drawer.id) + 1;
    if (index > room.players.length - 1) {
      index = 0;
    }
    this.changeDrawTokenToPlayerInRoom(room.players[index].id, roomId);
    game.actualWord = gameController.generateWord();
    this.sendToDrawer(roomId, game.actualWord, 'actualWord');

  }

  getRoomById(roomId) {
    const roomIndex = this.getRoomIndexById(roomId);
    return this.rooms[roomIndex];
  }

  getRoomIndexById(roomId) {
    return this.rooms.findIndex(room => room.id === roomId);
  }

  async sendToAllClientsInRoom(data, roomId) {
    for (const client of this.clients) {
      if (client.roomId === roomId) {
        await client.client.send(data);
      }
    }
  }

  disableConnectToRoom(roomId) {
    const roomIndex = this.getRoomIndexById(roomId);
    if (roomIndex < 0) {
      return false;
    }
    this.rooms[roomIndex].canConnect = false;
  }

  canConnectToRoom(roomId) {
    const roomIndex = this.getRoomIndexById(roomId)
    if (roomIndex < 0) {
      return false;
    }
    return this.rooms[roomIndex].canConnect;
  }

  correctWords(words, roomId) {
    const room = this.getRoomById(roomId);
    const removedDiacritics = words.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const actualRemovedDiacritics = room.game.actualWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return removedDiacritics.toLowerCase() === actualRemovedDiacritics.toLowerCase();
  }

  async startGameInRoom(roomId) {
    const room = this.getRoomById(roomId);
    const game = room.game;
    game.actualWord = gameController.generateWord();
    this.sendToDrawer(roomId, game.actualWord, 'actualWord')
    game.lastTime = (new Date()).getTime();
    await this.renderer(game, roomId, room.players.length);
  }

  async renderer(game, roomId, playersLength) {
    const roomManager = this;
    let numberOfPlayer = 0;
    const interval = await setInterval(function () {
      if (game.round > game.rounds) {
        clearInterval(interval);
        const data = JSON.stringify({data: true, type: 'endGame'});
        roomManager.sendToAllClientsInRoom(data, roomId);
        return;
      }
      let currentTime = (new Date()).getTime();
      if (currentTime - game.lastTime >= 1000) {
        game.lastTime = currentTime;
        game.actualTime++;
        const gameData = {
          round: game.round, rounds: game.rounds, points: game.points, time: game.actualTime
        }
        roomManager.sendToAllClientsInRoom(JSON.stringify({data: gameData, type: 'gameData'}), roomId);
        if (game.actualTime >= game.limitInSeconds || roomManager.countCorrectPlayers(roomId) === playersLength - 1) {
          game.actualTime = 0;
          roomManager.moveTokenToNextPlayer(roomId, game);
          numberOfPlayer++;
          const data = JSON.stringify({data: roomManager.getRoomById(roomId), type: 'allPlayers'});
          roomManager.sendToAllClientsInRoom(data, roomId);
          if (numberOfPlayer > playersLength - 1) {
            game.round++;
            numberOfPlayer = 0;
          }
          roomManager.removeCorrectFlagPlayers(roomId);
        }
      }
    }, 1000);
  }

  countPoints(roomId, playerId) {
    const room = this.getRoomById(roomId);
    const drawer = this.getDrawer(roomId);
    const player = this.getPlayerById(roomId, playerId);
    const game = room.game;
    player.points += (game.limitInSeconds - game.actualTime);
    drawer.points += Math.round((game.limitInSeconds - game.actualTime) / 10);
  }

  countCorrectPlayers(roomId) {
    let counter = 0;
    const room = this.getRoomById(roomId);
    room.players.forEach((player) => {
      if (player.correctRound) {
        counter++;
      }
    });
    return counter;
  }

  removeCorrectFlagPlayers(roomId) {
    const room = this.getRoomById(roomId);
    room.players.forEach((player) => {
      if (player.correctRound) {
        player.correctRound = false;
      }
    });
  }
}

module.exports = {
  RoomsController
}
