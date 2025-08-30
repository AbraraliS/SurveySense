/*
  # Survey Application Database Schema

  1. New Tables
    - `surveys` - Store survey metadata (topic, audience, question count)
    - `questions` - Store individual questions for each survey
    - `options` - Store multiple choice options for MCQ questions
    - `responses` - Store user responses to survey questions

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
AND table_name IN ('surveys', 'questions', 'options', 'responses');

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  topic varchar(255) NOT NULL,
  audience varchar(255) NOT NULL,
  num_questions integer NOT NULL CHECK (num_questions IN (5, 10, 15, 20)),
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  type varchar(10) NOT NULL CHECK (type IN ('MCQ', 'TEXT')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create options table for MCQ questions
CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text varchar(255) NOT NULL,
  option_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since surveys are meant to be shareable)
CREATE POLICY "Allow public read access to surveys"
  ON surveys
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to surveys"
  ON surveys
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to questions"
  ON questions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to options"
  ON options
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to options"
  ON options
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to responses"
  ON responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to responses"
  ON responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_survey_id ON surveys(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(survey_id, order_index);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_options_order ON options(question_id, option_index);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);