const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import modules
const { generateSurveyQuestions } = require('./question_generator'); // Fixed import name
const { analyzeResponses } = require('./ml_analysis');

// Routes
app.post('/api/create_survey', async (req, res) => {
  try {
    const { topic, audience, num_questions } = req.body;
    
    // Validate input
    if (!topic || !audience || ![5, 10, 15, 20].includes(num_questions)) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide topic, audience, and valid question count (5, 10, 15, or 20)' 
      });
    }

    // Calculate MCQ and text question counts
    const questionCounts = {
      5: { mcq: 4, text: 1 },
      10: { mcq: 8, text: 2 },
      15: { mcq: 12, text: 3 },
      20: { mcq: 16, text: 4 }
    };

    const { mcq, text } = questionCounts[num_questions];

    // Generate questions using OpenRouter API - Fixed function call
    const generatedQuestions = await generateSurveyQuestions(`${topic} for ${audience}`, num_questions);
    
    // Create survey in database
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert([{
        topic,
        audience,
        num_questions,
        survey_id: uuidv4()
      }])
      .select()
      .single();

    if (surveyError) {
      console.error('Survey creation error:', surveyError);
      return res.status(500).json({ error: 'Failed to create survey' });
    }

    // Insert questions and options
    const questionsData = [];
    const optionsData = [];

    generatedQuestions.forEach((q, index) => {
      const questionId = uuidv4();
      
      // Map question types to database format
      const dbType = q.type === 'multiple_choice' ? 'MCQ' : 'TEXT';
      
      questionsData.push({
        id: questionId,
        survey_id: survey.id,
        question_text: q.question,
        type: dbType,
        order_index: index + 1
      });

      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((option, optIndex) => {
          optionsData.push({
            question_id: questionId,
            option_text: option,
            option_index: optIndex
          });
        });
      }
    });

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) {
      console.error('Questions creation error:', questionsError);
      return res.status(500).json({ error: 'Failed to create questions' });
    }

    if (optionsData.length > 0) {
      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsData);

      if (optionsError) {
        console.error('Options creation error:', optionsError);
        return res.status(500).json({ error: 'Failed to create options' });
      }
    }

    // Format response
    const response = {
      survey_id: survey.survey_id,
      topic: survey.topic,
      audience: survey.audience,
      questions: generatedQuestions.map((q, index) => ({
        id: questionsData[index].id,
        type: q.type === 'multiple_choice' ? 'MCQ' : 'TEXT',
        text: q.question,
        options: q.options || null
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/survey/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (surveyError || !survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Get questions with options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('survey_id', survey.id)
      .order('order_index');

    if (questionsError) {
      console.error('Questions fetch error:', questionsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    const formattedQuestions = questions.map(q => ({
      id: q.id,
      type: q.type,
      text: q.question_text,
      options: q.options?.sort((a, b) => a.option_index - b.option_index).map(opt => opt.option_text) || null
    }));

    res.json({
      survey_id: survey.survey_id,
      topic: survey.topic,
      audience: survey.audience,
      questions: formattedQuestions
    });

  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/submit_response', async (req, res) => {
  try {
    const { survey_id, responses } = req.body;

    if (!survey_id || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Get survey from database
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id')
      .eq('survey_id', survey_id)
      .single();

    if (surveyError || !survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Insert responses
    const responseData = responses.map(r => ({
      survey_id: survey.id,
      question_id: r.question_id,
      answer: r.answer
    }));

    const { error: responseError } = await supabase
      .from('responses')
      .insert(responseData);

    if (responseError) {
      console.error('Response submission error:', responseError);
      return res.status(500).json({ error: 'Failed to submit responses' });
    }

    res.json({ message: 'Responses submitted successfully' });

  } catch (error) {
    console.error('Error submitting responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analysis/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    const analysis = await analyzeResponses(surveyId, supabase);
    res.json(analysis);

  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;