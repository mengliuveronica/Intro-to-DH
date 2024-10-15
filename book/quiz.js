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
  const response = await fetch(`https://api.airtable.com/v0/appkIFRKGG6cHGW1K/Exams/${examId}`, {
    headers: {
      'Authorization': 'Bearer patIi26p44lAC1Pe6.eefdb4a277315ebcf280cfd2a82aef511257ab5fdd8850269fbcc83680de478b'
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

    const response = await fetchWithRetry(API_URL, {
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

function createExam(examData, examId, studentId) {
  const quizContainer = document.getElementById('exam-container');
  createQuiz({
    questions: examData.fields.Questions,
    answers: examData.fields.Answers
  }, "exam-container", function(score, answers) {
    submitExamResults(studentId, examId, score, answers);
    showExamResults(score, examData.fields.Questions.length);
    // This line triggers the analysis
    analyzeExamResults(examId).then(analysisData => displayAnalysis(analysisData));
  });
}

function showExamResults(score, total) {
  const resultsContainer = document.getElementById('exam-results');
  resultsContainer.style.display = 'block';
  let message = '';
  if (score === total) {
    message = '💯 Perfect score! Excellent job!';
  } else if (score > total / 2) {
    message = '👍 Great work! You\'re doing well!';
  } else {
    message = '⛽️ Keep practicing, you\'ll improve!';
  }
  resultsContainer.innerHTML = `
    <div class="result-quiz">
      <div class="score">You scored ${score} out of ${total}!</div>
      <div class="message">${message}</div>
    </div>
  `;
}

const AIRTABLE_BASE_ID = 'appkIFRKGG6cHGW1K';
const AIRTABLE_TABLE_NAME = 'ExamResults';
const AIRTABLE_API_KEY = 'patIi26p44lAC1Pe6.eefdb4a277315ebcf280cfd2a82aef511257ab5fdd8850269fbcc83680de478b';
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
