
// Check if required global variables are defined
if (typeof AIRTABLE_BASE_ID === 'undefined' || typeof AIRTABLE_API_KEY === 'undefined' || typeof EXAM_RESULTS_API_URL === 'undefined') {
  console.error('Required global variables are not defined. Make sure config.js is loaded before quiz.js');
}

function convertBackticksToCode(text) {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function createQuiz(quizData, containerId, callback) {
  const quizContainer = document.getElementById(containerId);
  let quizHTML = '<div class="quiz">';
  
  quizData.questions.forEach((q, i) => {
    quizHTML += `<div class="question">
      <p>${i + 1}. ${convertBackticksToCode(q.text)}</p>
      ${q.options.map((opt, j) => `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${convertBackticksToCode(opt)}
        </label><br>
      `).join('')}
    </div>`;
  });
  
  quizHTML += `<button id="submit-button" onclick="submitQuiz('${containerId}')">Submit</button></div>
    <div id="result-${containerId}"></div>`;
  
  quizContainer.innerHTML = quizHTML;
  quizContainer.dataset.answers = JSON.stringify(quizData.answers);
  
  const submitButton = quizContainer.querySelector('#submit-button');
  submitButton.addEventListener('click', function() {
    const answers = JSON.parse(quizContainer.dataset.answers);
    let score = 0;
    let studentAnswers = [];
    
    answers.forEach((answer, i) => {
      const selected = quizContainer.querySelector(`input[name="q${i}"]:checked`);
      if (selected) {
        const selectedValue = parseInt(selected.value);
        studentAnswers.push(selectedValue);
        if (selectedValue === answer) {
          score++;
        }
      } else {
        studentAnswers.push(null);
      }
    });
    
    if (callback) {
      callback(score, studentAnswers);
    }
  });
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

async function fetchExamData(examId) {
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Exams/${examId}`, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  return await response.json();
}

async function submitExamResults(student, score, answers) {
  try {
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];

    const requestBody = {
      fields: {
        Name: student.fields.Name,
        Score: Number(score), // Ensure score is a number
        Answers: JSON.stringify(answers.map((answer, index) => {
          if (answer === null) return 'Unanswered';
          return answer === examAnswers[index] ? 'Correct' : `Wrong-${answer}`;
        })),
        Date: isoDate
      }
    };

    console.log('Submitting exam results:', JSON.stringify(requestBody, null, 2));

    const response = await fetchWithRetry(EXAM_RESULTS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Exam results submitted successfully:', response);
  } catch (error) {
    console.error('Error submitting exam results:', error);
    if (error.response) {
      const errorText = await error.response.text();
      console.error('Error response:', errorText);
    }
    alert('An error occurred while submitting your exam results. Please contact your instructor.');
  }
}

// Implement exponential backoff for API requests
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}

function createExam(student) {
  console.log('Creating exam for student:', student);
  if (typeof window.createQuiz !== 'function') {
    console.error('createQuiz is not a function. quiz.js may not be loaded correctly.');
    alert('There was an error loading the quiz. Please refresh the page and try again.');
    return;
  }
  window.createQuiz({
    questions: examQuestions,
    answers: examAnswers
  }, "exam-container", function(score, studentAnswers) {
    submitExamResults(student, score, studentAnswers);
    showExamResults(score, examQuestions.length);
    analyzeExamResults().then(analysisData => displayAnalysis(analysisData));
    document.getElementById('show-analysis-button').style.display = 'block';
  });
}

function showExamResults(score, totalQuestions) {
  const resultsDiv = document.getElementById('exam-results');
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = `
    <h3>Quiz Results</h3>
    <p>Your answers have been successfully submitted.</p>
    <p>You scored ${score} out of ${totalQuestions}.</p>
    ${getCustomMessage(score, totalQuestions)}
  `;
  document.getElementById('exam-container').style.display = 'none';
}

function getCustomMessage(score, totalQuestions) {
  const percentage = (score / totalQuestions) * 100;
  if (percentage >= 90) {
    return '<p>Excellent work! You have a strong understanding of the material.</p>';
  } else if (percentage >= 70) {
    return '<p>Good job! You have a solid grasp of most concepts.</p>';
  } else if (percentage >= 50) {
    return '<p>You\'re on the right track, but there\'s room for improvement. Review the material and try again.</p>';
  } else {
    return '<p>It seems you\'re struggling with the material. Please review the course content and consider seeking additional help.</p>';
  }
}

// Make functions globally accessible
window.createQuiz = createQuiz;
window.submitQuiz = submitQuiz;
window.fetchExamData = fetchExamData;
window.submitExamResults = submitExamResults;
window.fetchWithRetry = fetchWithRetry;
window.createExam = createExam;
window.showExamResults = showExamResults;
window.getCustomMessage = getCustomMessage;

console.log('quiz.js loaded, functions attached to window object');
