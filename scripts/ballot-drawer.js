const BallotDrawer = {
  suits: ['♥', '♦', '♣', '♠'],
  values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  deck: [],
  drawnCards: [],

  init: function(elementId) {
    this.element = document.getElementById(elementId);
    this.resetDeck();
    this.render();
  },

  resetDeck: function() {
    this.deck = this.suits.flatMap(suit => 
      this.values.map(value => ({ suit, value }))
    );
    this.shuffleDeck();
    this.drawnCards = [];
    this.render();
  },

  shuffleDeck: function() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  },

  drawCard: function() {
    if (this.deck.length > 0) {
      const drawnCard = this.deck.pop();
      this.drawnCards.push(drawnCard);
      this.shuffleDeck();
      this.render();
    }
  },

  getScore: function(value) {
    if (value === 'A') return 1;
    if (value === 'J') return 11;
    if (value === 'Q') return 12;
    if (value === 'K') return 13;
    return parseInt(value);
  },

  render: function() {
    const totalScore = this.drawnCards.reduce((sum, card) => sum + this.getScore(card.value), 0);
    
    this.element.innerHTML = `
      <div class="ballot-drawer">
        <p>Remaining cards: <strong>${this.deck.length}</strong></p>
        <p>Total score: <strong>${totalScore}</strong></p>
        <div class="drawn-cards">
          ${this.drawnCards.map(card => `
            <div class="card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">
              <div>${card.value}</div>
              <div>${card.suit}</div>
            </div>
          `).join('')}
        </div>
        <button onclick="BallotDrawer.drawCard()">Draw Card</button>
        <button onclick="BallotDrawer.resetDeck()">Reset</button>
      </div>
    `;
  }
};

