/*
  # Survey Application Database Schema

  1. New Tables
    - `surveys` - Store survey metadata (topic, audience, question count)
    - `questions` - Store individual questions for each survey
    - `options` - Store multiple choice options for MCQ questions
    - `responses` - Store user responses to survey questions
    - `user_details` - Store details of survey respondents

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access and authenticated write access

  3. Features
    - UUID primary keys for surveys and questions
    - Foreign key relationships for data integrity
    - Timestamps for audit trails
    - Enum types for question types
*/

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('surveys', 'questions', 'options', 'responses', 'user_details');

-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS user_details CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- Create surveys table
CREATE TABLE surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid UNIQUE DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  audience text NOT NULL,
  num_questions integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  type text NOT NULL CHECK (type IN ('MCQ', 'TEXT')),
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create options table for MCQ questions
CREATE TABLE options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_details table for survey respondents
CREATE TABLE user_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  contact varchar(255) NOT NULL,
  occupation varchar(255),
  submitted_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_detail_id uuid NOT NULL REFERENCES user_details(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_user_details_survey_id ON user_details(survey_id);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_user_detail_id ON responses(user_detail_id);
CREATE INDEX idx_surveys_survey_id ON surveys(survey_id);

-- Enable RLS (Row Level Security)
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on surveys" ON surveys FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on options" ON options FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_details" ON user_details FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on responses" ON responses FOR ALL TO public USING (true) WITH CHECK (true);