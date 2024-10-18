console.log('examAnalysis.js is being executed');


async function fetchExamResults(supabaseClient) {
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    console.error('Invalid Supabase client in examAnalysis.js');
    throw new Error('Invalid Supabase client');
  }

  const { data, error } = await supabaseClient
    .from(EXAM_RESULTS_TABLE_NAME)
    .select('*');

  if (error) throw error;
  return data;
}

async function analyzeExamResults(supabaseClient) {
  console.log('analyzeExamResults function called');
  try {
    const { data: examResults, error } = await supabaseClient
      .from(EXAM_RESULTS_TABLE_NAME)
      .select('*');

    if (error) throw error;

    // Group records by student name and keep only the latest record for each student
    const latestRecords = examResults.reduce((acc, record) => {
      const name = record.Name;
      const date = new Date(record.Date);
      if (!acc[name] || date > new Date(acc[name].Date)) {
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
      };
    });

    uniqueRecords.forEach(record => {
      const score = record.score;
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;

      let answers = record.answers;
      if (typeof answers === 'string') {
        try {
          answers = JSON.parse(answers);
        } catch (e) {
          console.warn(`Invalid JSON in answers for record:`, record);
          answers = [];
        }
      }

      if (Array.isArray(answers)) {
        answers.forEach((answer, index) => {
          if (typeof answer === 'string') {
            if (answer.startsWith('Wrong-')) {
              const optionIndex = parseInt(answer.split('-')[1]);
              if (!isNaN(optionIndex) && questionStats[index] && questionStats[index].options[optionIndex]) {
                questionStats[index].options[optionIndex].count++;
              }
            } else if (answer === 'Correct') {
              if (questionStats[index] && questionStats[index].options[examAnswers[index]]) {
                questionStats[index].options[examAnswers[index]].count++;
              }
            }
          }
        });
      }
    });

    return {
      totalStudents,
      scoreDistribution,
      questionStats
    };
  } catch (error) {
    console.error('Error analyzing exam results:', error);
    throw error;
  }
}

function displayAnalysis(analysisData) {
  console.log('displayAnalysis function called');
  const analysisContainer = document.getElementById('exam-analysis');
  analysisContainer.innerHTML = '<h2 class="analysis-title">Exam Analysis</h2>';

  function generateGradient(percentage, isCorrect) {
    const startColor = isCorrect ? [76, 175, 80] : [255, 87, 34];
    const endColor = isCorrect ? [27, 94, 32] : [183, 28, 28];
    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * (percentage / 100));
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * (percentage / 100));
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * (percentage / 100));
    return `linear-gradient(to right, rgb(${startColor.join(',')}), rgb(${r},${g},${b}))`;
  }

  // Overall Stats
  const overallStats = document.createElement('div');
  overallStats.className = 'section';
  overallStats.innerHTML = `
    <h3 class="section-title">Overall Statistics</h3>
    <p class="total-students">Total Students: ${analysisData.totalStudents}</p>
    <h4 class="subsection-title">Score Distribution</h4>
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
  questionAnalysis.className = 'section';
  questionAnalysis.innerHTML = '<h3 class="section-title">Question by Question Analysis</h3>';

  Object.entries(analysisData.questionStats).forEach(([index, stats]) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-section';
    questionDiv.innerHTML = `
      <h4 class="question-text">Question ${parseInt(index) + 1}: ${stats.text}</h4>
      <div class="bar-chart">
        ${stats.options.map((option, i) => {
          const percentage = ((option.count / analysisData.totalStudents) * 100).toFixed(2);
          const isCorrect = i === examAnswers[index];
          return `
            <div class="bar-container">
              <div class="bar-label">${option.text}: ${option.count} (${percentage}%)${isCorrect ? ' <span class="correct-label">(Correct)</span>' : ''}</div>
              <div class="bar-wrapper">
                <div class="bar" style="width: ${percentage}%; background: ${generateGradient(percentage, isCorrect)};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    questionAnalysis.appendChild(questionDiv);
  });

  analysisContainer.appendChild(questionAnalysis);
}

console.log('analyzeExamResults function defined:', typeof analyzeExamResults === 'function');
console.log('displayAnalysis function defined:', typeof displayAnalysis === 'function');

