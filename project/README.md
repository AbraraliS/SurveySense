# AI-Driven Survey Web Application

A full-stack web application that generates intelligent survey questions using AI and provides comprehensive analytics on responses.

## Features

- **AI-Powered Question Generation**: Uses OpenRouter API with Claude 3.5 Sonnet to generate contextual survey questions
- **Flexible Survey Creation**: Support for 5, 10, 15, or 20 questions with intelligent MCQ/text question distribution
- **Shareable Surveys**: Each survey gets a unique ID for easy sharing and multiple responses
- **Real-time Analytics**: Interactive charts and text analysis with word frequency insights
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + React Router
- **Backend**: Node.js + Express + Supabase
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenRouter API (Claude 3.5 Sonnet)
- **Charts**: Chart.js + React Chart.js 2
- **Deployment**: Vite for development server

## Setup Instructions

### 1. Environment Configuration

1. Copy `.env.example` to the backend directory:
   ```bash
   cp .env.example backend/.env
   ```

2. Configure your environment variables in `backend/.env`:

   **Supabase Setup:**
   - Go to [Supabase](https://supabase.com) and create a new project
   - Get your project URL and anon key from Settings > API
   - Get your service role key (keep this secure!)

   **OpenRouter Setup:**
   - Sign up at [OpenRouter](https://openrouter.ai)
   - Create an API key in your dashboard
   - Add credits to your account for API usage

   Update your `backend/.env` file:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   PORT=5000
   ```

   Also create a frontend `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Update the root `.env` file with frontend variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
### 2. Database Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Run the SQL schema from `database/schema.sql` to create all necessary tables
3. The schema includes proper indexes and Row Level Security policies

### 3. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### 4. Run the Application

Start the backend server:
```bash
cd backend
npm run dev
```

In a new terminal, start the frontend:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### POST /api/create_survey
Creates a new survey with AI-generated questions.

**Request Body:**
```json
{
  "topic": "Customer Satisfaction for Online Shopping",
  "audience": "College students",
  "num_questions": 10
}
```

**Response:**
```json
{
  "survey_id": "uuid-here",
  "topic": "Customer Satisfaction for Online Shopping",
  "audience": "College students",
  "questions": [
    {
      "id": "question-uuid",
      "type": "MCQ",
      "text": "How satisfied are you with delivery speed?",
      "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"]
    }
  ]
}
```

### GET /api/survey/:surveyId
Retrieves a survey by ID for taking.

### POST /api/submit_response
Submits survey responses.

**Request Body:**
```json
{
  "survey_id": "uuid-here",
  "responses": [
    {
      "question_id": "question-uuid",
      "answer": "Very satisfied"
    }
  ]
}
```

### GET /api/analysis/:surveyId
Retrieves comprehensive analytics for a survey.

## Question Generation Rules

The AI follows these rules for question distribution:
- **5 questions**: 4 MCQ + 1 Text
- **10 questions**: 8 MCQ + 2 Text  
- **15 questions**: 12 MCQ + 3 Text
- **20 questions**: 16 MCQ + 4 Text

Each MCQ includes 4 context-aware options tailored to the topic and audience.

## Analytics Features

- **MCQ Analysis**: Bar charts showing response distribution
- **Text Analysis**: Word frequency analysis and raw response viewing
- **Summary Statistics**: Completion rates, average response length, popular answers
- **Interactive Charts**: Hover effects and responsive design

## Development Notes

- The backend uses Supabase instead of MySQL for better WebContainer compatibility
- OpenRouter API integration provides high-quality AI question generation
- Chart.js provides interactive data visualizations
- All data is stored securely with proper validation and error handling

## Troubleshooting

1. **Survey not loading**: Check that your Supabase configuration is correct
2. **Questions not generating**: Verify your OpenRouter API key and account credits
3. **Charts not displaying**: Ensure Chart.js dependencies are properly installed
4. **CORS errors**: Make sure the backend server is running on port 5000

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

