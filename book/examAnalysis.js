console.log('examAnalysis.js is being executed');

async function fetchExamResults(supabaseClient) {
  console.log('Fetching exam results...');
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    console.error('Invalid Supabase client in examAnalysis.js');
    throw new Error('Invalid Supabase client');
  }

  const { data, error, count } = await supabaseClient
    .from(EXAM_RESULTS_TABLE_NAME)
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching exam results:', error);
    throw error;
  }

  console.log(`Fetched ${count} exam results`);
  return data;
}

async function analyzeExamResults(supabaseClient) {
  console.log('analyzeExamResults function called');
  try {
    // First, fetch the exam results
    const examResults = await fetchExamResults(supabaseClient);
    console.log('Total exam results fetched:', examResults.length);

    // Remove the grouping logic for now
    const uniqueRecords = examResults;
    console.log('Records to be analyzed:', uniqueRecords.length);

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
      // console.log('Analyzing record:', record);  // Add this line for debugging
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

    console.log('Score distribution:', scoreDistribution);
    console.log('Question stats:', questionStats);

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
  console.log('displayAnalysis function called with data:', analysisData);
  const analysisContainer = document.getElementById('exam-analysis');
  analysisContainer.innerHTML = '<h2 class="analysis-title">Quiz Analysis</h2>';

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

async function identifyMissingExamTakers(supabaseClient) {
  console.log('Identifying users who haven\'t taken the exam...');
  
  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('name');

    if (usersError) throw usersError;

    // Fetch all exam takers
    const { data: examTakers, error: examTakersError } = await supabaseClient
      .from(EXAM_RESULTS_TABLE_NAME)
      .select('name');

    if (examTakersError) throw examTakersError;

    // Get distinct exam taker names using JavaScript
    const distinctExamTakers = [...new Set(examTakers.map(taker => taker.name))];

    // Convert distinct exam takers to a Set for efficient lookup
    const examTakerSet = new Set(distinctExamTakers);

    // Find users who are not in the exam takers set
    const missingExamTakers = users.filter(user => !examTakerSet.has(user.name));

    console.log(`Found ${missingExamTakers.length} users who haven't taken the exam.`);
    return missingExamTakers;
  } catch (error) {
    console.error('Error identifying missing exam takers:', error);
    throw error;
  }
}

// This function will be called when the "Show Missing Exam Takers" button is clicked
async function displayMissingExamTakers(supabaseClient) {
  try {
    const missingExamTakers = await identifyMissingExamTakers(supabaseClient);
    const missingTakersContainer = document.getElementById('missing-exam-takers');
    missingTakersContainer.innerHTML = `
      <h3 class="section-title">Students Who Haven't Taken the Exam</h3>
      <p>Total: ${missingExamTakers.length}</p>
      <ul>
        ${missingExamTakers.map(user => `<li>${user.name}</li>`).join('')}
      </ul>
    `;
    missingTakersContainer.style.display = 'block';
  } catch (error) {
    console.error('Error displaying missing exam takers:', error);
    alert('An error occurred while fetching the list of missing exam takers. Please try again.');
  }
}

console.log('analyzeExamResults function defined:', typeof analyzeExamResults === 'function');
console.log('displayAnalysis function defined:', typeof displayAnalysis === 'function');

// Make sure to expose the new function
window.displayMissingExamTakers = displayMissingExamTakers;
