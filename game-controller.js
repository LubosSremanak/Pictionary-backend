class GameController {


  constructor() {
    this.words = ['medovník', 'obraz', 'budík', 'iphone', 'robot', 'koberec', 'činka', 'topánka', 'pohar',
      'hodinky', 'lampa', 'jokay',
      "Bahrajn", "bakalár", "baktéria", "balada", "bambus", "Bangladéš", "banán",
      "banánovník", "baran", "baranica", "borka", "borovica", "bosorka", "Boston",
      "bozk", "brada", "brat", "Bratislava", "bravčovina", "Brazília", "bronz", "broskyňa", "brt", "brucelóza", "brucho", "bruchopasník", "bruško", "bryndza", "bránica", "bróm", "brómargyrit", "bršlen",
      "Budapešť", "budhizmus", "budúcnosť", "buk", "bukovina", "bukvica", "bunda", "bungalov", "bunka",
      "chirurgia", "chlap", "chlapec", "chlieb",
      "chloroform", "chobotnica", "chodidlo", "chrbtica", "chrbát", "chren", "chrobák", "chrám", "chrípka", "chyža", "chémia", "cibuľa", "cica", "cicavec", "cikáda", "cintorín", "cirkev",
      "cisár", "citrónovník", "COVID-19", "cukor", "cukrík", "dcéra", "december", "decht", "dedina", "dedičnosť", "dedko"
    ];

  }

  generateWord() {
    const length = this.words.length;
    return this.words[Math.floor(Math.random() * length)];
  }

  formatMessage(message) {

  }

}

module.exports = {
  GameController
}


