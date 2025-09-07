const { OpenAI } = require('openai');
require('dotenv').config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function generateSurveyQuestions(topicAndAudience, questionCount = 5) {
  // Define questionCounts at the top so it's available in catch block
  const questionCounts = {
    5: { mcq: 4, text: 1 },
    10: { mcq: 8, text: 2 },
    15: { mcq: 12, text: 3 },
    20: { mcq: 16, text: 4 }
  };

  try {
    const { mcq, text } = questionCounts[questionCount] || { mcq: 4, text: 1 };

    console.log(`Generating ${questionCount} questions (${mcq} MCQ, ${text} text) for: ${topicAndAudience}`);

    const completion = await client.chat.completions.create({
      extra_headers: {
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "SurveySense",
      },
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        {
          role: "system",
          content: "You are an expert survey designer. Create well-structured survey questions that are clear, unbiased, and gather meaningful insights. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: `Create ${questionCount} survey questions about "${topicAndAudience}". 

Create exactly ${mcq} multiple choice questions and ${text} text questions.

Return a JSON array of objects with "question" and "type" fields. 

For multiple choice questions:
- Use type: "multiple_choice"
- Include an "options" array with exactly 4 options
- Make options realistic and balanced

For text questions:
- Use type: "text"
- No options needed

Example format:
[
  {
    "question": "What is your age group?",
    "type": "multiple_choice",
    "options": ["18-25", "26-35", "36-45", "46+"]
  },
  {
    "question": "Please describe your experience in detail.",
    "type": "text"
  }
]

Make sure to return exactly ${questionCount} questions total (${mcq} multiple choice + ${text} text).`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0].message.content;
    
    
    // Try to parse the JSON response
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseError) {
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate the response structure
    if (!Array.isArray(questions)) {
      throw new Error('AI response is not an array');
    }

    // Ensure each question has required fields and correct count
    questions = questions.slice(0, questionCount).map((q, index) => ({
      id: index + 1,
      question: q.question || `Question ${index + 1}`,
      type: q.type || 'text',
      options: q.type === 'multiple_choice' ? (q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4']) : undefined,
      required: true
    }));

    // If we don't have enough questions, add fallback ones
    while (questions.length < questionCount) {
      const index = questions.length;
      const isText = index >= mcq;
      
      questions.push({
        id: index + 1,
        question: isText 
          ? `Please share your additional thoughts about ${topicAndAudience}.`
          : `How would you rate your experience with ${topicAndAudience}?`,
        type: isText ? 'text' : 'multiple_choice',
        options: isText ? undefined : ['Excellent', 'Good', 'Fair', 'Poor'],
        required: true
      });
    }

    return questions;

  } catch (error) {
    
    
    // Fallback questions if AI fails - questionCounts is now defined above
    const { mcq, text } = questionCounts[questionCount] || { mcq: 4, text: 1 };
    const fallbackQuestions = [];
    
    // Add MCQ questions
    for (let i = 0; i < mcq; i++) {
      fallbackQuestions.push({
        id: i + 1,
        question: `Question ${i + 1}: What is your opinion about ${topicAndAudience}?`,
        type: 'multiple_choice',
        options: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'],
        required: true
      });
    }
    
    // Add text questions
    for (let i = 0; i < text; i++) {
      fallbackQuestions.push({
        id: mcq + i + 1,
        question: `Question ${mcq + i + 1}: Please share your detailed thoughts about ${topicAndAudience}.`,
        type: 'text',
        required: false
      });
    }

    
    return fallbackQuestions;
  }
}

module.exports = {
  generateSurveyQuestions
};
