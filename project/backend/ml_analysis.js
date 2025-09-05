async function analyzeResponses(surveyId, supabase) {
  try {
    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (surveyError || !survey) {
      throw new Error('Survey not found');
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*),
        responses (*)
      `)
      .eq('survey_id', survey.id)
      .order('order_index');

    if (questionsError) {
      throw new Error('Failed to fetch questions');
    }

    const analysis = {
      survey_id: surveyId,
      topic: survey.topic,
      audience: survey.audience,
      total_responses: 0,
      mcq_analysis: [],
      text_analysis: [],
      summary: {}
    };

    // Calculate total unique responses
    const allResponses = questions.flatMap(q => q.responses || []);
    const uniqueResponders = new Set(allResponses.map(r => r.id));
    analysis.total_responses = uniqueResponders.size;

    // Analyze MCQ questions
    const mcqQuestions = questions.filter(q => q.type === 'MCQ');
    mcqQuestions.forEach(question => {
      const responses = question.responses || [];
      const optionCounts = {};
      
      // Initialize counts
      question.options.forEach(option => {
        optionCounts[option.option_text] = 0;
      });

      // Count responses
      responses.forEach(response => {
        if (optionCounts.hasOwnProperty(response.answer)) {
          optionCounts[response.answer]++;
        }
      });

      analysis.mcq_analysis.push({
        question_id: question.id,
        question_text: question.question_text,
        responses: responses.length,
        data: {
          labels: Object.keys(optionCounts),
          values: Object.values(optionCounts)
        },
        chart_type: 'bar'
      });
    });

    // Analyze TEXT questions
    const textQuestions = questions.filter(q => q.type === 'TEXT');
    textQuestions.forEach(question => {
      const responses = question.responses || [];
      const wordFrequency = {};
      
      responses.forEach(response => {
        if (response.answer) {
          // Simple word frequency analysis
          const words = response.answer
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3); // Filter out short words

          words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        }
      });

      // Get top 10 most frequent words
      const sortedWords = Object.entries(wordFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      analysis.text_analysis.push({
        question_id: question.id,
        question_text: question.question_text,
        responses: responses.length,
        raw_responses: responses.map(r => r.answer),
        word_frequency: {
          labels: sortedWords.map(([word]) => word),
          values: sortedWords.map(([, count]) => count)
        }
      });
    });

    // Generate summary
    analysis.summary = {
      completion_rate: analysis.total_responses > 0 ? '100%' : '0%',
      avg_response_length: textQuestions.length > 0 
        ? Math.round(
            textQuestions.reduce((sum, q) => {
              const avgLength = (q.responses || [])
                .reduce((acc, r) => acc + (r.answer?.length || 0), 0) / Math.max(q.responses?.length || 1, 1);
              return sum + avgLength;
            }, 0) / textQuestions.length
          )
        : 0,
      most_popular_mcq_answer: mcqQuestions.length > 0
        ? getMostPopularAnswer(analysis.mcq_analysis)
        : 'N/A'
    };

    return analysis;

  } catch (error) {
    
    throw error;
  }
}

function getMostPopularAnswer(mcqAnalysis) {
  let maxCount = 0;
  let popularAnswer = 'N/A';

  mcqAnalysis.forEach(q => {
    q.data.values.forEach((count, index) => {
      if (count > maxCount) {
        maxCount = count;
        popularAnswer = q.data.labels[index];
      }
    });
  });

  return popularAnswer;
}

module.exports = { analyzeResponses };
