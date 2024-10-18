const SUPABASE_URL = 'https://zvuouirzacmtxsmglspc.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dW91aXJ6YWNtdHhzbWdsc3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkwODM2MDUsImV4cCI6MjA0NDY1OTYwNX0.BXSeXvqW558J4qHL9AmqXbJQs7rvBIuW_3L6_GsBkjM';
const USERS_TABLE_NAME = 'users';
const EXAM_RESULTS_TABLE_NAME = 'examresults';

// Check if required global variables are defined
if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_API_KEY === 'undefined' || typeof USERS_TABLE_NAME === 'undefined' || typeof EXAM_RESULTS_TABLE_NAME === 'undefined') {
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

async function submitExamResults(supabaseClient, student, score, answers) {
  console.log('Submitting exam results:', { student, score, answers });
  try {
    const formattedAnswers = answers.map((answer, index) => 
      answer === examAnswers[index] ? 'Correct' : `Wrong-${answer}`
    );

    const { data, error } = await supabaseClient
      .from(EXAM_RESULTS_TABLE_NAME)
      .insert({
        name: student.name,
        score: score,
        answers: formattedAnswers,
        date: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Exam results submitted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error submitting exam results:', error);
    throw error;
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

function createExam(supabaseClient, student) {
  console.log('Creating exam for student:', student.name);
  if (!student || !student.name) {
    console.error('Invalid student object:', student);
    alert('An error occurred while starting the exam. Please contact support.');
    return;
  }

  // Store supabaseClient and student name in a closure
  const submitExam = async (answers, score) => {
    await submitExamResults(supabaseClient, student, score, answers);
  };

  if (typeof window.createQuiz !== 'function') {
    console.error('createQuiz is not a function. quiz.js may not be loaded correctly.');
    alert('There was an error loading the quiz. Please refresh the page and try again.');
    return;
  }
  window.createQuiz({
    questions: examQuestions,
    answers: examAnswers
  }, "exam-container", function(score, studentAnswers) {
    submitExam(studentAnswers, score);
    showExamResults(score, examQuestions.length);
    document.getElementById('run-analysis-button').style.display = 'block';
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
  
  if (percentage === 100) {
    return `
      <p>🎉 Wow, a perfect score! 🏆</p>
      <p>Keep up the amazing work – you're on your way to become a DH pro! 🌟</p>
    `;
  } else if (percentage > 90) {
    return `
      <p>🥇 Fantastic job! Your grasp of DH with R is really strong.</p>
      <p>Just a tiny bit more, and you'll be at the top. You've got this! 💪</p>
    `;
  } else if (percentage > 80) {
    return `
      <p>🥈 Great work! You've got a solid understanding of DH with R.</p>
      <p>Keep it up, and you'll be an expert in no time. 📚💻</p>
    `;
  } else if (percentage > 60) {
    return `
      <p>🥉 Nice one! You passed and you're getting the hang of DH with R.</p>
      <p>Keep exploring and asking questions – you're making good progress! 🚀</p>
    `;
  } else {
    return `
      <p>😵‍💫 Looks like you are struggling... DH can be tricky at first.</p>
      <p>Take some time to review, and don't hesitate to ask for help! You can do it! 💪🎓</p>
    `;
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
