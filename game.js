class Game {
  constructor() {
    this.rounds = 3;
    this.round = 1;
    this.points = [];
    this.limitInSeconds = 40;
    this.actualWord = '';
    this.actualTime = 0;
    this.lastTime = 0;
    this.correctPlayers = 0;
  }
}

module.exports = {
  Game
}
