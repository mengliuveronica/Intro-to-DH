console.log('examAnalysis.js is being executed');

const AIRTABLE_BASE_ID = 'appkIFRKGG6cHGW1K';
const AIRTABLE_TABLE_NAME = 'ExamResults';
const AIRTABLE_API_KEY = 'patIi26p44lAC1Pe6.eefdb4a277315ebcf280cfd2a82aef511257ab5fdd8850269fbcc83680de478b';
const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

async function fetchExamResults() {
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  return await response.json();
}

async function analyzeExamResults() {
  console.log('analyzeExamResults function called');
  const resultsData = await fetchExamResults();
  const totalStudents = resultsData.records.length;
  let scoreDistribution = {};
  let questionStats = {};

  // Initialize questionStats based on examQuestions
  examQuestions.forEach((question, index) => {
    questionStats[index] = {
      text: question.text,
      options: question.options.map(option => ({ text: option, count: 0 })),
      unanswered: 0
    };
  });

  resultsData.records.forEach(record => {
    const score = record.fields.Score;
    scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;

    const answers = JSON.parse(record.fields.Answers);
    answers.forEach((answer, index) => {
      if (answer === 'Unanswered') {
        questionStats[index].unanswered++;
      } else if (answer.startsWith('Wrong-')) {
        const optionIndex = parseInt(answer.split('-')[1]);
        questionStats[index].options[optionIndex].count++;
      } else { // Correct answer
        questionStats[index].options[examAnswers[index]].count++;
      }
    });
  });

  return {
    totalStudents,
    scoreDistribution,
    questionStats
  };
}

function displayAnalysis(analysisData) {
  console.log('displayAnalysis function called');
  const analysisContainer = document.getElementById('exam-analysis');
  analysisContainer.innerHTML = '<h2>Exam Analysis</h2>';

  // Overall Stats
  const overallStats = document.createElement('div');
  overallStats.innerHTML = `
    <h3>Overall Statistics</h3>
    <p>Total Students: ${analysisData.totalStudents}</p>
    <h4>Score Distribution</h4>
    <ul>
      ${Object.entries(analysisData.scoreDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([score, count]) => `<li>Score ${score}: ${count} student(s)</li>`)
        .join('')}
    </ul>
  `;
  analysisContainer.appendChild(overallStats);

  // Question by Question Analysis
  const questionAnalysis = document.createElement('div');
  questionAnalysis.innerHTML = '<h3>Question by Question Analysis</h3>';

  Object.entries(analysisData.questionStats).forEach(([index, stats]) => {
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
      <h4>Question ${parseInt(index) + 1}: ${stats.text}</h4>
      <ul>
        ${stats.options.map((option, i) => `
          <li>${option.text}: ${option.count} (${((option.count / analysisData.totalStudents) * 100).toFixed(2)}%)
            ${i === examAnswers[index] ? ' <strong>(Correct Answer)</strong>' : ''}
          </li>
        `).join('')}
        <li>Unanswered: ${stats.unanswered} (${((stats.unanswered / analysisData.totalStudents) * 100).toFixed(2)}%)</li>
      </ul>
    `;
    questionAnalysis.appendChild(questionDiv);
  });

  analysisContainer.appendChild(questionAnalysis);
}

// Make functions globally accessible
window.analyzeExamResults = analyzeExamResults;
window.displayAnalysis = displayAnalysis;

console.log('analyzeExamResults function defined:', typeof window.analyzeExamResults === 'function');
console.log('displayAnalysis function defined:', typeof window.displayAnalysis === 'function');
