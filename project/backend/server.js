require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { generateSurveyQuestions } = require('./question_generator');

const app = express();
const PORT = process.env.PORT || 5000;

// Reduce console noise in production (keep errors)
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test Supabase connection on startup
console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://surveysense.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const host = new URL(origin).hostname;
      const isVercel = host.endsWith('.vercel.app');
      if (allowedOrigins.includes(origin) || isVercel) {
        return callback(null, true);
      }
    } catch (e) {}
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add explicit preflight handling
app.options('*', cors());

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('Verifying token...');
    
    // Use the service role key client to verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token', details: error.message });
    }

    if (!user) {
      console.log('No user found for token');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('Token verified for user:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification exception:', error);
    res.status(401).json({ error: 'Token verification failed', details: error.message });
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SurveySense API is running',
    timestamp: new Date().toISOString(),
    supabase: process.env.SUPABASE_URL ? 'Connected' : 'Not configured'
  });
});

// Test Supabase connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Test 1: Simple connection test
    console.log('Testing basic Supabase connection...');
    
    // Test if we can access the surveys table (even if empty)
    const { data, error, count } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database test error:', error);
      
      // Check if it's a table not found error
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({ 
          status: 'Supabase connected but tables need to be created',
          error: 'Tables not found - please run migrations',
          details: error.message,
          suggestion: 'Run the SQL migrations in Supabase dashboard'
        });
      }
      
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: error.message,
        code: error.code
      });
    }
    
    res.json({ 
      status: 'Database connected successfully',
      tableExists: true,
      recordCount: count || 0,
      message: 'Surveys table accessible'
    });
    
  } catch (err) {
    console.error('Database test exception:', err);
    res.status(500).json({ 
      error: 'Database test failed', 
      details: err.message 
    });
  }
});

// Get all surveys for authenticated user
app.get('/api/surveys', verifyToken, async (req, res) => {
  try {
    console.log('Fetching surveys for user:', req.user.id);
    
    // First, check what columns exist in the table
    const { data: tableInfo, error: tableError } = await supabase
      .from('surveys')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Database error:', tableError);
      
      // Handle table not existing
      if (tableError.code === 'PGRST116' || tableError.message.includes('relation') || tableError.message.includes('does not exist')) {
        console.warn('Surveys table does not exist');
        return res.json([]);
      }
      
      return res.status(500).json({ 
        error: 'Database error', 
        details: tableError.message 
      });
    }

    // Try to fetch surveys, but handle missing created_by column
    let query = supabase.from('surveys').select('*');
    
    // Try to filter by created_by if the column exists
    try {
      const { data: surveys, error } = await query
        .eq('created_by', req.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log(`Found ${surveys?.length || 0} surveys for user ${req.user.id}`);
      res.json(surveys || []);
      
    } catch (createdByError) {
      // If created_by column doesn't exist, return all surveys (temporary)
      console.warn('created_by column not found, returning all surveys:', createdByError.message);
      
      const { data: allSurveys, error: allError } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allError) {
        return res.status(500).json({ 
          error: 'Failed to fetch surveys', 
          details: allError.message 
        });
      }
      
      res.json(allSurveys || []);
    }
    
  } catch (error) {
    console.error('Server error fetching surveys:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Create new survey
app.post('/api/survey', verifyToken, async (req, res) => {
  try {
    console.log('Creating survey for user:', req.user.id);
    console.log('Request body:', req.body);
    
    const { topic, audience, num_questions } = req.body;

    if (!topic || !audience || !num_questions) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['topic', 'audience', 'num_questions'] 
      });
    }

    const surveyData = {
      topic,
      audience,
      num_questions: parseInt(num_questions),
      questions_count: 0,
      responses_count: 0,
      created_by: req.user.id
    };

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert([surveyData])
      .select()
      .single();

    if (error) {
      console.error('Database error creating survey:', error);
      return res.status(500).json({ 
        error: 'Failed to create survey', 
        details: error.message 
      });
    }

    console.log('Survey created successfully:', survey.survey_id || survey.id);
    
    // Add explicit headers and ensure proper JSON response
    res.set('Content-Type', 'application/json');
    res.status(201).json({
      success: true,
      data: survey,
      message: 'Survey created successfully'
    });
    
  } catch (error) {
    console.error('Server error creating survey:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get single survey
app.get('/api/survey/:id', verifyToken, async (req, res) => {
  try {
    console.log('Fetching survey:', req.params.id, 'for user:', req.user.id);
    
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('survey_id', req.params.id)
      .eq('created_by', req.user.id)
      .single();

    if (error) {
      console.error('Database error fetching survey:', error);
      return res.status(404).json({ 
        error: 'Survey not found', 
        details: error.message 
      });
    }

    console.log('Survey found:', survey);
    res.json(survey);
    
  } catch (error) {
    console.error('Server error fetching survey:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Update survey
app.put('/api/survey/:id', verifyToken, async (req, res) => {
  try {
    console.log('Updating survey:', req.params.id, 'for user:', req.user.id);
    
    const { topic, audience, num_questions } = req.body;
    const updateData = {};
    
    if (topic) updateData.topic = topic;
    if (audience) updateData.audience = audience;
    if (num_questions) updateData.num_questions = parseInt(num_questions);
    
    updateData.updated_at = new Date().toISOString();

    const { data: survey, error } = await supabase
      .from('surveys')
      .update(updateData)
      .eq('survey_id', req.params.id)
      .eq('created_by', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating survey:', error);
      return res.status(404).json({ 
        error: 'Survey not found or update failed', 
        details: error.message 
      });
    }

    res.json(survey);
    
  } catch (error) {
    console.error('Server error updating survey:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Delete survey
app.delete('/api/survey/:id', verifyToken, async (req, res) => {
  try {
    console.log('Deleting survey:', req.params.id, 'for user:', req.user.id);
    
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('survey_id', req.params.id)
      .eq('created_by', req.user.id);

    if (error) {
      console.error('Database error deleting survey:', error);
      return res.status(404).json({ 
        error: 'Survey not found or delete failed', 
        details: error.message 
      });
    }

    res.json({ message: 'Survey deleted successfully' });
    
  } catch (error) {
    console.error('Server error deleting survey:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get public survey (no auth required)
app.get('/api/survey/:id/public', async (req, res) => {
  try {
    console.log('Fetching public survey:', req.params.id);
    
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('survey_id, topic, audience, description, status, is_active, expires_at')
      .eq('survey_id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !survey) {
      console.error('Survey not found or inactive:', error);
      return res.status(404).json({ 
        error: 'Survey not found or inactive'
      });
    }

    // Check if survey has expired
    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return res.status(404).json({ 
        error: 'Survey has expired'
      });
    }

    // Get questions for this survey
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('question_id, question_text, question_type, options')
      .eq('survey_id', req.params.id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Database error fetching questions:', questionsError);
      return res.status(500).json({ 
        error: 'Failed to fetch questions', 
        details: questionsError.message 
      });
    }

    // Map questions to the expected format
    const formattedQuestions = questions.map(q => ({
      question_id: q.question_id,
      question: q.question_text,
      type: q.question_type,
      options: q.options
    }));

    res.json({
      survey_id: survey.survey_id,
      topic: survey.topic,
      audience: survey.audience,
      description: survey.description,
      questions: formattedQuestions
    });
    
  } catch (error) {
    console.error('Server error fetching public survey:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get survey questions
app.get('/api/survey/:id/questions', async (req, res) => {
  try {
    console.log('Fetching questions for survey:', req.params.id);
    
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', req.params.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Database error fetching questions:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch questions', 
        details: error.message 
      });
    }

    res.json(questions || []);
    
  } catch (error) {
    console.error('Server error fetching questions:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Create a new question
app.post('/api/question', verifyToken, async (req, res) => {
  try {
    console.log('Creating question for user:', req.user.id);
    console.log('Question data:', req.body);
    
    const { survey_id, question_text, question_type, options, order_index } = req.body;

    if (!survey_id || !question_text || !question_type) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['survey_id', 'question_text', 'question_type'] 
      });
    }

    // Verify the user owns the survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('survey_id')
      .eq('survey_id', survey_id)
      .eq('created_by', req.user.id)
      .single();

    if (surveyError || !survey) {
      return res.status(403).json({ error: 'Not authorized to add questions to this survey' });
    }

    const questionData = {
      survey_id,
      question_text,
      question_type,
      options: options || null,
      order_index: order_index || 1,
      created_at: new Date().toISOString()
    };

    const { data: question, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single();

    if (error) {
      console.error('Database error creating question:', error);
      return res.status(500).json({ 
        error: 'Failed to create question', 
        details: error.message 
      });
    }

    // Update the questions count in the survey
    const { data: currentSurvey } = await supabase
      .from('surveys')
      .select('questions_count')
      .eq('survey_id', survey_id)
      .single();

    await supabase
      .from('surveys')
      .update({ 
        questions_count: (currentSurvey?.questions_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('survey_id', survey_id);

    console.log('Question created successfully:', question.question_id || question.id);
    res.status(201).json(question);
    
  } catch (error) {
    console.error('Server error creating question:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Update an existing question
app.put('/api/question/:id', verifyToken, async (req, res) => {
  try {
    console.log('Updating question for user:', req.user.id);
    console.log('Question ID:', req.params.id);
    console.log('Question data:', req.body);
    
    const questionId = req.params.id;
    const { question_text, question_type, options } = req.body;

    if (!question_text || !question_type) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['question_text', 'question_type'] 
      });
    }

    // First, get the question to verify ownership
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select(`
        question_id,
        survey_id,
        surveys!inner(created_by)
      `)
      .eq('question_id', questionId)
      .single();

    if (fetchError || !existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify the user owns the survey
    if (existingQuestion.surveys.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this question' });
    }

    const updateData = {
      question_text,
      question_type,
      options: options || null,
      updated_at: new Date().toISOString()
    };

    const { data: question, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('question_id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating question:', error);
      return res.status(500).json({ 
        error: 'Failed to update question', 
        details: error.message 
      });
    }

    console.log('Question updated successfully:', question.question_id);
    res.status(200).json(question);
    
  } catch (error) {
    console.error('Server error updating question:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Submit survey response (public - no auth required)
app.post('/api/survey/:id/response', async (req, res) => {
  try {
    console.log('Submitting response for survey:', req.params.id);
    console.log('Request body:', req.body);
    
    const { responses, user_name, user_email, user_age, user_occupation, completion_time } = req.body;
    const surveyId = req.params.id;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Responses array is required' });
    }

    if (!user_name) {
      return res.status(400).json({ error: 'User name is required' });
    }

    // Generate a session ID for this response session
    const sessionId = require('crypto').randomUUID();
    
    // Create response records for each question
    const responseRecords = responses.map(response => {
      const record = {
        survey_id: surveyId,
        question_id: response.question_id,
        session_id: sessionId,
        answer_text: response.answer,
        respondent_name: user_name || null,
        respondent_email: user_email || null,
        respondent_age: user_age && user_age !== '' ? parseInt(user_age) : null,
        respondent_occupation: user_occupation || null,
        is_complete: true,
        submitted_at: new Date().toISOString()
      };
      return record;
    });

    // Insert all response records
    const { data: insertedResponses, error } = await supabase
      .from('responses')
      .insert(responseRecords)
      .select();

    if (error) {
      console.error('Database error submitting response:', error);
      return res.status(500).json({ 
        error: 'Failed to submit response', 
        details: error.message 
      });
    }

    // Create a response session record
    const sessionRecord = {
      session_id: sessionId,
      survey_id: surveyId,
      respondent_name: user_name || null,
      respondent_email: user_email || null,
      respondent_age: user_age && user_age !== '' ? parseInt(user_age) : null,
      respondent_occupation: user_occupation || null,
      is_complete: true,
      completed_at: new Date().toISOString(),
      total_time_seconds: completion_time || 0
    };
    
    const { error: sessionError } = await supabase
      .from('response_sessions')
      .insert([sessionRecord]);

    if (sessionError) {
      console.error('Database error creating session:', sessionError);
      // Don't fail the request for session creation error
    }

    // Update the survey's responses_count (count response sessions, not individual responses)
    // First get the current count, then increment it
    const { data: currentSurvey, error: fetchError } = await supabase
      .from('surveys')
      .select('responses_count')
      .eq('survey_id', surveyId)
      .single();

    if (!fetchError && currentSurvey) {
      const newCount = (currentSurvey.responses_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('surveys')
        .update({ 
          responses_count: newCount,
          last_response_at: new Date().toISOString()
        })
        .eq('survey_id', surveyId);

      if (updateError) {
        console.error('Error updating survey responses count:', updateError);
        // Don't fail the request for this error
      }
    } else {
      console.error('Error fetching current survey count:', fetchError);
    }
    
    try {
      res.status(201).json({ 
        message: 'Response submitted successfully', 
        session_id: sessionId,
        responses_count: 1 // This represents 1 response session
      });
    } catch (responseError) {
      console.error('Error sending response:', responseError);
      // If response was already sent, don't try to send again
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error sending response', 
          details: responseError.message 
        });
      }
    }
    
  } catch (error) {
    console.error('Server error submitting response:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get survey responses (protected)
app.get('/api/survey/:id/responses', verifyToken, async (req, res) => {
  try {
    console.log('Fetching responses for survey:', req.params.id, 'by user:', req.user.id);
    
    // First verify the user owns this survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('survey_id, created_by')
      .eq('survey_id', req.params.id)
      .single();

    if (surveyError) {
      return res.status(500).json({ error: 'Failed to verify survey ownership' });
    }

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view responses for this survey' });
    }

    // First, fetch response sessions to get the correct count
    const { data: responseSessions, error: sessionsError } = await supabase
      .from('response_sessions')
      .select('*')
      .eq('survey_id', req.params.id)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      return res.status(500).json({ 
        error: 'Failed to fetch response sessions', 
        details: sessionsError.message 
      });
    }

    // Now fetch individual responses for each session
    const { data: responses, error } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', req.params.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      // Handle case where table doesn't exist
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json([]);
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch responses', 
        details: error.message 
      });
    }

    // Group responses by session_id to match frontend expectations
    const groupedResponses = {};
    (responses || []).forEach(response => {
      const sessionId = response.session_id;
      if (!groupedResponses[sessionId]) {
        // Find the corresponding session to get completion time
        const session = responseSessions.find(s => s.session_id === sessionId);
        
        groupedResponses[sessionId] = {
          response_id: sessionId,
          survey_id: response.survey_id,
          responses: [],
          created_at: response.submitted_at,
          respondent_id: response.respondent_name,
          respondent_name: response.respondent_name,
          respondent_email: response.respondent_email,
          respondent_age: response.respondent_age || null,
          respondent_occupation: response.respondent_occupation || null,
          completion_time: session?.total_time_seconds || null
        };
      }
      groupedResponses[sessionId].responses.push({
        question_id: response.question_id,
        answer: response.answer_text || response.selected_option || response.numeric_value?.toString() || ''
      });
    });

    const groupedResponseSessions = Object.values(groupedResponses);
    
    res.json(groupedResponseSessions);
    
  } catch (error) {
    console.error('Server error fetching responses:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});


// Manual fix for response counts (for debugging)
app.post('/api/fix-response-counts', verifyToken, async (req, res) => {
  try {
    console.log('Manual fix requested by user');
    await fixResponseCounts();
    res.json({ message: 'Response and questions counts fixed successfully' });
  } catch (error) {
    console.error('Error in manual fix:', error);
    res.status(500).json({ error: 'Failed to fix response counts' });
  }
});

// Generate questions for a survey using AI
app.post('/api/generate-questions', async (req, res) => {
  try {
    console.log('Generate questions request body:', req.body);
    
    const { topic, audience, numQuestions } = req.body; // Accept numQuestions from frontend

    // Validate required fields
    if (!topic || !audience || !numQuestions) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['topic', 'audience', 'numQuestions'],
        received: { topic, audience, numQuestions }
      });
    }

    const numQuestionsInt = parseInt(numQuestions);
    if (isNaN(numQuestionsInt) || numQuestionsInt < 1 || numQuestionsInt > 20) {
      return res.status(400).json({ 
        error: 'numQuestions must be a number between 1 and 20',
        received: numQuestions
      });
    }

    console.log('Generating questions for:', { topic, audience, numQuestions: numQuestionsInt });

    // Generate questions
    const prompt = `Create a survey about "${topic}" for "${audience}"`;
    const generatedQuestions = await generateSurveyQuestions(prompt, numQuestionsInt);

    console.log('Generated questions:', generatedQuestions.length);

    // Return the generated questions
    res.status(200).json({
      success: true,
      data: {
        questions: generatedQuestions
      },
      message: `Successfully generated ${generatedQuestions.length} questions`
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message
    });
  }
});

// Helper function to generate mock questions
function generateMockQuestions(topic, audience, numQuestions) {
  const questions = [
    {
      question_text: `How satisfied are you with ${topic.toLowerCase()}?`,
      type: 'MCQ',
      options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
    },
    {
      question_text: `What is your primary reason for interest in ${topic.toLowerCase()}?`,
      type: 'MCQ',
      options: ['Quality', 'Price', 'Convenience', 'Recommendation', 'Other']
    },
    {
      question_text: `How likely are you to recommend this to other ${audience.toLowerCase()}?`,
      type: 'MCQ',
      options: ['Very Likely', 'Likely', 'Neutral', 'Unlikely', 'Very Unlikely']
    },
    {
      question_text: `What improvements would you suggest for ${topic.toLowerCase()}?`,
      type: 'TEXT',
      options: null
    },
    {
      question_text: `Any additional comments about ${topic.toLowerCase()}?`,
      type: 'TEXT',
      options: null
    }
  ];

  return questions.slice(0, numQuestions);
}

// Helper function to generate questions with AI (placeholder for now)
async function generateQuestionsWithAI(topic, audience, numQuestions) {
  // This would integrate with OpenRouter API
  // For now, return enhanced mock questions
  console.log('AI generation called for:', { topic, audience, numQuestions });
  
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock questions for now
  return generateMockQuestions(topic, audience, numQuestions);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// One-time fix for response counts (count respondents, not individual responses)
async function fixResponseCounts() {
  try {
    console.log('Fixing response counts for all surveys (counting respondents)...');
    
    // Get all surveys
    const { data: surveys, error: surveysError } = await supabase
      .from('surveys')
      .select('survey_id, responses_count, questions_count');

    if (surveysError) {
      console.error('Error fetching surveys:', surveysError);
      return;
    }

    console.log(`Found ${surveys.length} surveys to fix`);

    // Fix response counts and questions counts for each survey
    for (const survey of surveys) {
      console.log(`Processing survey ${survey.survey_id}...`);
      
      // Count actual response sessions (respondents)
      const { data: sessions, error: sessionsError } = await supabase
        .from('response_sessions')
        .select('session_id')
        .eq('survey_id', survey.survey_id);

      // Count actual questions
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('question_id')
        .eq('survey_id', survey.survey_id);

      let updates = {};
      
      // Fix response count
      if (!sessionsError && sessions) {
        const correctResponseCount = sessions.length;
        console.log(`Survey ${survey.survey_id}: Found ${sessions.length} response sessions, current count: ${survey.responses_count}`);
        updates.responses_count = correctResponseCount;
      } else {
        console.log(`Survey ${survey.survey_id}: No response sessions found or error:`, sessionsError);
        updates.responses_count = 0;
      }
      
      // Fix questions count
      if (!questionsError && questions) {
        const correctQuestionsCount = questions.length;
        console.log(`Survey ${survey.survey_id}: Found ${questions.length} questions, current count: ${survey.questions_count}`);
        updates.questions_count = correctQuestionsCount;
      } else {
        console.log(`Survey ${survey.survey_id}: No questions found or error:`, questionsError);
        updates.questions_count = 0;
      }
      
      // Update both counts
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('surveys')
          .update(updates)
          .eq('survey_id', survey.survey_id);
          
        if (updateError) {
          console.error(`Error updating survey ${survey.survey_id}:`, updateError);
        } else {
          console.log(`✓ Fixed survey ${survey.survey_id}:`, updates);
        }
      }
    }
    
    console.log('Response and questions counts fixed successfully!');
  } catch (error) {
    console.error('Error fixing response counts:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 SurveySense API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 DB test: http://localhost:${PORT}/api/test-db`);
  // Run the fix once when server starts
  await fixResponseCounts();
});

module.exports = app;
