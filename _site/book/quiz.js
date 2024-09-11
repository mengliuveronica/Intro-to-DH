function createQuiz(quizData, quizId) {
  const quizContainer = document.getElementById(quizId);
  let quizHTML = '<div class="quiz">';
  
  quizData.questions.forEach((q, i) => {
    quizHTML += `<div class="question">
      <p>${i + 1}. ${q.text}</p>
      ${q.options.map((opt, j) => `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${opt}
        </label><br>
      `).join('')}
    </div>`;
  });
  
  quizHTML += `<button onclick="submitQuiz('${quizId}')">Submit</button></div>
    <div id="result-${quizId}"></div>`;
  
  quizContainer.innerHTML = quizHTML;
  quizContainer.dataset.answers = JSON.stringify(quizData.answers);
}

function submitQuiz(quizId) {
  const quizContainer = document.getElementById(quizId);
  const resultContainer = document.getElementById(`result-${quizId}`);
  const answers = JSON.parse(quizContainer.dataset.answers);
  let score = 0;
  
  answers.forEach((answer, i) => {
    const selected = quizContainer.querySelector(`input[name="q${i}"]:checked`);
    if (selected && parseInt(selected.value) === answer) {
      score++;
    }
  });
  
  let message = '';
  if (score === answers.length) {
    message = '💯 Perfect score! Excellent job!';
  } else if (score > answers.length / 2) {
    message = '👍 Great work! You\'re doing well!';
  } else {
    message = '⛽️ Keep practicing, you\'ll improve!';
  }
  
  resultContainer.innerHTML = `
    <div class="result-quiz">
      <div class="score">You scored ${score} out of ${answers.length}!</div>
      <div class="message">${message}</div>
    </div>
  `;
  resultContainer.querySelector('.result-quiz').classList.add('show');
}