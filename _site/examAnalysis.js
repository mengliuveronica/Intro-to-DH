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
  
  // Group records by student name and keep only the latest record for each student
  const latestRecords = resultsData.records.reduce((acc, record) => {
    const name = record.fields.Name;
    const date = new Date(record.fields.Date);
    if (!acc[name] || date > new Date(acc[name].fields.Date)) {
      acc[name] = record;
    }
    return acc;
  }, {});

  const uniqueRecords = Object.values(latestRecords);
  const totalStudents = uniqueRecords.length;
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

  uniqueRecords.forEach(record => {
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

  // Helper function to generate gradient
  function generateGradient(percentage, isCorrect) {
    const startColor = isCorrect ? [76, 175, 80] : [255, 87, 34];  // Green or Deep Orange
    const endColor = isCorrect ? [27, 94, 32] : [183, 28, 28];     // Dark Green or Dark Red
    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * (percentage / 100));
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * (percentage / 100));
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * (percentage / 100));
    return `linear-gradient(to right, rgb(${startColor.join(',')}), rgb(${r},${g},${b}))`;
  }

  // Overall Stats
  const overallStats = document.createElement('div');
  overallStats.innerHTML = `
    <h3>Overall Statistics</h3>
    <p>Total Students: ${analysisData.totalStudents}</p>
    <h4>Score Distribution</h4>
    <div class="bar-chart">
      ${Object.entries(analysisData.scoreDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([score, count]) => {
          const percentage = ((count / analysisData.totalStudents) * 100).toFixed(2);
          return `
            <div class="bar-container">
              <div class="bar-label">Score ${score}: ${count} (${percentage}%)</div>
              <div class="bar-wrapper">
                <div class="bar" style="width: ${percentage}%; background: ${generateGradient(percentage, true)};"></div>
              </div>
            </div>
          `;
        }).join('')}
    </div>
  `;
  analysisContainer.appendChild(overallStats);

  // Question by Question Analysis
  const questionAnalysis = document.createElement('div');
  questionAnalysis.innerHTML = '<h3>Question by Question Analysis</h3>';

  Object.entries(analysisData.questionStats).forEach(([index, stats]) => {
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
      <h4 class="question-text">Question ${parseInt(index) + 1}: ${stats.text}</h4>
      <div class="bar-chart">
        ${stats.options.map((option, i) => {
          const percentage = ((option.count / analysisData.totalStudents) * 100).toFixed(2);
          const isCorrect = i === examAnswers[index];
          return `
            <div class="bar-container">
              <div class="bar-label">${option.text}: ${option.count} (${percentage}%)${isCorrect ? ' (Correct)' : ''}</div>
              <div class="bar-wrapper">
                <div class="bar" style="width: ${percentage}%; background: ${generateGradient(percentage, isCorrect)};"></div>
              </div>
            </div>
          `;
        }).join('')}
        <div class="bar-container">
          <div class="bar-label">Unanswered: ${stats.unanswered} (${((stats.unanswered / analysisData.totalStudents) * 100).toFixed(2)}%)</div>
          <div class="bar-wrapper">
            <div class="bar unanswered" style="width: ${((stats.unanswered / analysisData.totalStudents) * 100).toFixed(2)}%;"></div>
          </div>
        </div>
      </div>
    `;
    questionAnalysis.appendChild(questionDiv);
  });

  analysisContainer.appendChild(questionAnalysis);

  // Add CSS for the bar charts
  const style = document.createElement('style');
  style.textContent = `
    .bar-chart {
      width: 100%;
      margin-bottom: 20px;
    }
    .bar-container {
      margin-bottom: 15px;
    }
    .bar-label {
      margin-bottom: 5px;
      font-size: 0.9em;
      white-space: normal;
      word-wrap: break-word;
    }
    .bar-wrapper {
      width: 100%;
      background-color: #f0f0f0;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      transition: width 0.3s ease;
    }
    .bar.unanswered {
      background: linear-gradient(to right, #FFA000, #FF6F00);
    }
    .question-text {
      font-size: 0.9em;
      font-weight: bold;
      margin-bottom: 10px;
    }
  `;
  document.head.appendChild(style);
}

// Make functions globally accessible
window.analyzeExamResults = analyzeExamResults;
window.displayAnalysis = displayAnalysis;

console.log('analyzeExamResults function defined:', typeof window.analyzeExamResults === 'function');
console.log('displayAnalysis function defined:', typeof window.displayAnalysis === 'function');
