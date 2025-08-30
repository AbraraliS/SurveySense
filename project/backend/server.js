const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors());
app.use(express.json());

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3.1:free';

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Get all surveys endpoint
app.get('/api/surveys', async (req, res) => {
  try {
    console.log('Fetching all surveys...');
    
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys:', error);
      return res.status(500).json({ error: 'Failed to fetch surveys' });
    }

    console.log('Found surveys:', surveys?.length || 0);

    // Get question counts and response counts for each survey
    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        // Get questions count
        const { count: questionsCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', survey.id);

        // Get responses count
        const { count: responsesCount } = await supabase
          .from('user_details')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', survey.survey_id);

        return {
          survey_id: survey.survey_id,
          topic: survey.topic,
          audience: survey.audience,
          num_questions: survey.num_questions,
          created_at: survey.created_at,
          questions_count: questionsCount || 0,
          responses_count: responsesCount || 0
        };
      })
    );

    res.json(surveysWithCounts);

  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create survey endpoint
app.post('/api/create_survey', async (req, res) => {
  try {
    const { topic, audience, num_questions } = req.body;

    if (!topic || !audience || !num_questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Creating survey:', { topic, audience, num_questions });

    // Insert survey into Supabase FIRST
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert([{
        topic,
        audience,
        num_questions: parseInt(num_questions)
      }])
      .select()
      .single();

    if (surveyError) {
      console.error('Error inserting survey:', surveyError);
      return res.status(500).json({ error: 'Failed to save survey' });
    }

    console.log('Survey created in DB:', survey);

    // Generate questions using AI
    const questionsData = await generateQuestions(topic, audience, num_questions);
    
    // Insert questions
    const questionsToInsert = questionsData.map((q, index) => ({
      survey_id: survey.id,
      question_text: q.question,
      type: q.type,
      order_index: index
    }));

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) {
      console.error('Error inserting questions:', questionsError);
      // Don't fail completely, survey is already saved
    } else {
      console.log('Questions created:', questions.length);

      // Insert options for MCQ questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionData = questionsData[i];
        
        if (questionData.type === 'MCQ' && questionData.options) {
          const optionsToInsert = questionData.options.map((option, optionIndex) => ({
            question_id: question.id,
            option_text: option,
            option_index: optionIndex
          }));

          const { error: optionsError } = await supabase
            .from('options')
            .insert(optionsToInsert);

          if (optionsError) {
            console.error('Error inserting options:', optionsError);
          }
        }
      }
    }

    // Return survey data regardless of questions generation
    res.json({
      survey_id: survey.survey_id,
      topic: survey.topic,
      audience: survey.audience,
      num_questions: survey.num_questions,
      created_at: survey.created_at
    });

  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get survey endpoint
app.get('/api/survey/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    console.log('Fetching survey:', surveyId);

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (surveyError || !survey) {
      console.error('Survey not found:', surveyError);
      return res.status(404).json({ error: 'Survey not found' });
    }

    console.log('Survey found:', survey);

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
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    console.log('Questions found:', questions.length);

    // Format questions
    const formattedQuestions = questions.map(q => ({
      question_id: q.id,
      question: q.question_text,
      type: q.type,
      options: q.type === 'MCQ' ? q.options.sort((a, b) => a.option_index - b.option_index).map(opt => opt.option_text) : undefined
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

// Update survey endpoint
app.put('/api/survey/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { topic, audience } = req.body;

    if (!topic || !audience) {
      return res.status(400).json({ error: 'Topic and audience are required' });
    }

    console.log('Updating survey:', surveyId, { topic, audience });

    // Update survey in database
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .update({ topic, audience })
      .eq('survey_id', surveyId)
      .select()
      .single();

    if (surveyError || !survey) {
      console.error('Error updating survey:', surveyError);
      return res.status(404).json({ error: 'Survey not found or failed to update' });
    }

    console.log('Survey updated:', survey);

    res.json({
      survey_id: survey.survey_id,
      topic: survey.topic,
      audience: survey.audience,
      num_questions: survey.num_questions,
      created_at: survey.created_at
    });

  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete survey endpoint
app.delete('/api/survey/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    console.log('Deleting survey:', surveyId);

    // Get survey first to get the internal ID
    const { data: survey, error: findError } = await supabase
      .from('surveys')
      .select('id')
      .eq('survey_id', surveyId)
      .single();

    if (findError || !survey) {
      console.error('Survey not found:', findError);
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Delete survey (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('surveys')
      .delete()
      .eq('survey_id', surveyId);

    if (deleteError) {
      console.error('Error deleting survey:', deleteError);
      return res.status(500).json({ error: 'Failed to delete survey' });
    }

    console.log('Survey deleted successfully:', surveyId);

    res.json({ message: 'Survey deleted successfully' });

  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update question endpoint
app.put('/api/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question_text, options } = req.body;

    if (!question_text) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    console.log('Updating question:', questionId, { question_text, options });

    // Update question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update({ question_text })
      .eq('id', questionId)
      .select()
      .single();

    if (questionError || !question) {
      console.error('Error updating question:', questionError);
      return res.status(404).json({ error: 'Question not found or failed to update' });
    }

    // Update options if it's an MCQ question
    if (question.type === 'MCQ' && options && Array.isArray(options)) {
      // Delete existing options
      const { error: deleteOptionsError } = await supabase
        .from('options')
        .delete()
        .eq('question_id', questionId);

      if (deleteOptionsError) {
        console.error('Error deleting old options:', deleteOptionsError);
      }

      // Insert new options
      const optionsToInsert = options.map((option, index) => ({
        question_id: questionId,
        option_text: option,
        option_index: index
      }));

      const { error: insertOptionsError } = await supabase
        .from('options')
        .insert(optionsToInsert);

      if (insertOptionsError) {
        console.error('Error inserting new options:', insertOptionsError);
        return res.status(500).json({ error: 'Failed to update options' });
      }
    }

    res.json({ message: 'Question updated successfully' });

  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit response endpoint
app.post('/api/submit_response', async (req, res) => {
  try {
    const { survey_id, user_details, responses } = req.body;

    console.log('Submitting response:', { survey_id, user_details, responses: responses?.length });

    if (!survey_id || !user_details || !responses) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate user details
    const { name, age, contact, occupation } = user_details;
    if (!name || !age || !contact) {
      return res.status(400).json({ error: 'Name, age, and contact are required' });
    }

    // Insert user details
    const { data: userDetail, error: userError } = await supabase
      .from('user_details')
      .insert([{
        survey_id,
        name: name.trim(),
        age: parseInt(age),
        contact: contact.trim(),
        occupation: occupation?.trim() || null
      }])
      .select()
      .single();

    if (userError) {
      console.error('Error inserting user details:', userError);
      return res.status(500).json({ 
        error: 'Failed to save user details',
        details: userError.message 
      });
    }

    console.log('User details saved:', userDetail);

    // Insert responses
    const responsesToInsert = responses.map(response => ({
      survey_id,
      question_id: response.question_id,
      answer: response.answer,
      user_detail_id: userDetail.id
    }));

    const { error: responsesError } = await supabase
      .from('responses')
      .insert(responsesToInsert);

    if (responsesError) {
      console.error('Error inserting responses:', responsesError);
      return res.status(500).json({ error: 'Failed to save responses' });
    }

    console.log('Responses saved:', responsesToInsert.length);

    res.json({ 
      message: 'Response submitted successfully',
      user_detail_id: userDetail.id
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analysis endpoint
app.get('/api/analysis/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    console.log('Fetching analysis for survey:', surveyId);

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (surveyError || !survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Get total responses count
    const { count: totalResponses } = await supabase
      .from('user_details')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId);

    // Get questions with responses for analysis
    const { data: questions } = await supabase
      .from('questions')
      .select(`
        *,
        options (*),
        responses (*)
      `)
      .eq('survey_id', survey.id)
      .order('order_index');

    // Process MCQ analysis
    const mcqAnalysis = questions
      ?.filter(q => q.type === 'MCQ')
      .map(question => {
        const responses = question.responses || [];
        const optionCounts = {};
        
        // Initialize counts
        question.options?.forEach(option => {
          optionCounts[option.option_text] = 0;
        });
        
        // Count responses
        responses.forEach(response => {
          if (optionCounts.hasOwnProperty(response.answer)) {
            optionCounts[response.answer]++;
          }
        });

        return {
          question_id: question.id,
          question_text: question.question_text,
          responses: responses.length,
          data: {
            labels: Object.keys(optionCounts),
            values: Object.values(optionCounts)
          },
          chart_type: 'pie'
        };
      }) || [];

    // Process text analysis
    const textAnalysis = questions
      ?.filter(q => q.type === 'TEXT')
      .map(question => {
        const responses = question.responses || [];
        const rawResponses = responses.map(r => r.answer);
        
        return {
          question_id: question.id,
          question_text: question.question_text,
          responses: responses.length,
          raw_responses: rawResponses
        };
      }) || [];

    res.json({
      survey_id: surveyId,
      topic: survey.topic,
      audience: survey.audience,
      total_responses: totalResponses || 0,
      mcq_analysis: mcqAnalysis,
      text_analysis: textAnalysis,
      summary: {
        completion_rate: '100%',
        avg_response_length: 0,
        most_popular_mcq_answer: 'N/A'
      }
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get survey results endpoint - NEW ENDPOINT
app.get('/api/surveys/:surveyId/results', async (req, res) => {
  try {
    const { surveyId } = req.params;

    console.log('Fetching survey results for:', surveyId);

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (surveyError || !survey) {
      console.error('Survey not found:', surveyError);
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
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Get all user details for this survey
    const { data: userDetails, error: userDetailsError } = await supabase
      .from('user_details')
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });

    if (userDetailsError) {
      console.error('Error fetching user details:', userDetailsError);
      return res.status(500).json({ error: 'Failed to fetch user details' });
    }

    // Get all responses for this survey
    const { data: allResponses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.type.toLowerCase(),
      options: q.type === 'MCQ' ? q.options.sort((a, b) => a.option_index - b.option_index).map(opt => opt.option_text) : undefined
    }));

    // Group responses by user
    const responsesByUser = allResponses.reduce((acc, response) => {
      if (!acc[response.user_detail_id]) {
        acc[response.user_detail_id] = {};
      }
      acc[response.user_detail_id][response.question_id] = response.answer;
      return acc;
    }, {});

    // Format user responses
    const formattedResponses = userDetails.map(user => {
      const userResponses = responsesByUser[user.id] || {};
      
      return {
        response_id: user.id,
        survey_id: surveyId,
        user_id: user.id,
        user_name: user.name,
        user_email: user.contact.includes('@') ? user.contact : undefined,
        user_ip: user.contact.includes('@') ? undefined : user.contact, // Assume non-email contact is phone/other
        responses: userResponses,
        submitted_at: user.submitted_at,
        completion_time: Math.floor(Math.random() * 300) + 60 // Mock completion time for now
      };
    });

    // Calculate analytics
    const totalResponses = userDetails.length;
    const completionRate = totalResponses > 0 ? 95 : 0; // Mock completion rate
    const avgCompletionTime = 120; // Mock average time

    // Calculate response by date
    const responseByDate = userDetails.reduce((acc, user) => {
      const date = new Date(user.submitted_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const results = {
      survey: {
        survey_id: survey.survey_id,
        topic: survey.topic,
        audience: survey.audience,
        created_at: survey.created_at,
        questions_count: questions.length,
        responses_count: totalResponses
      },
      questions: formattedQuestions,
      responses: formattedResponses,
      analytics: {
        total_responses: totalResponses,
        completion_rate: completionRate,
        average_completion_time: avgCompletionTime,
        response_by_date: responseByDate
      }
    };

    console.log('Survey results fetched successfully:', {
      surveyId,
      questionsCount: questions.length,
      responsesCount: totalResponses
    });

    res.json(results);

  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI question generation function
async function generateQuestions(topic, audience, numQuestions) {
  if (!OPENROUTER_API_KEY) {
    console.log('No OpenRouter API key, using fallback questions');
    return getFallbackQuestions(topic, numQuestions);
  }

  const prompt = `Generate ${numQuestions} survey questions about "${topic}" for "${audience}". 
  
  Mix of question types:
  - 60% Multiple Choice Questions (MCQ) with 4 options each
  - 40% Text/Open-ended questions
  
  Return JSON format:
  [
    {
      "question": "Question text",
      "type": "MCQ",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    },
    {
      "question": "Question text",
      "type": "TEXT"
    }
  ]
  
  Make questions relevant, engaging, and appropriate for the target audience.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'SurveySense'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating questions:', error);
    return getFallbackQuestions(topic, numQuestions);
  }
}

function getFallbackQuestions(topic, numQuestions) {
  const questions = [
    {
      question: `What is your overall opinion about ${topic}?`,
      type: 'MCQ',
      options: ['Excellent', 'Good', 'Average', 'Poor']
    },
    {
      question: `How would you describe your experience with ${topic}?`,
      type: 'TEXT'
    },
    {
      question: `How likely are you to recommend ${topic} to others?`,
      type: 'MCQ',
      options: ['Very Likely', 'Likely', 'Unlikely', 'Very Unlikely']
    },
    {
      question: `What improvements would you suggest for ${topic}?`,
      type: 'TEXT'
    }
  ];
  
  return questions.slice(0, numQuestions);
}

// Log all available endpoints
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service key configured:', !!supabaseServiceKey);
  console.log('OpenRouter API key configured:', !!OPENROUTER_API_KEY);
  
  console.log('\nAvailable endpoints:');
  console.log('GET    /api/test');
  console.log('GET    /api/surveys');
  console.log('POST   /api/create_survey');
  console.log('GET    /api/survey/:surveyId');
  console.log('PUT    /api/survey/:surveyId');
  console.log('DELETE /api/survey/:surveyId');
  console.log('PUT    /api/question/:questionId');
  console.log('POST   /api/submit_response');
  console.log('GET    /api/analysis/:surveyId');
  console.log('GET    /api/surveys/:surveyId/results');  // <-- NEW ENDPOINT
});