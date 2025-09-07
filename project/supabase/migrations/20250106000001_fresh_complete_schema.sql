-- =====================================================
-- SurveySense Complete Fresh Database Schema
-- =====================================================

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS public.responses CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.surveys CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_survey_counts() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  surveys_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_email_unique UNIQUE (email),
  CONSTRAINT user_profiles_surveys_limit_check CHECK (surveys_limit >= 0)
);

-- =====================================================
-- 2. SURVEYS TABLE
-- =====================================================
CREATE TABLE public.surveys (
  survey_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  audience TEXT NOT NULL,
  description TEXT,
  num_questions INTEGER NOT NULL DEFAULT 0,
  questions_count INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  average_time_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  allow_anonymous BOOLEAN NOT NULL DEFAULT true,
  collect_email BOOLEAN NOT NULL DEFAULT false,
  one_response_per_user BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT false,
  password_protected BOOLEAN NOT NULL DEFAULT false,
  survey_password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analytics fields
  sentiment_score DECIMAL(3,2) DEFAULT 0.00,
  ml_insights JSONB,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT surveys_pkey PRIMARY KEY (survey_id),
  CONSTRAINT surveys_num_questions_check CHECK (num_questions >= 0),
  CONSTRAINT surveys_questions_count_check CHECK (questions_count >= 0),
  CONSTRAINT surveys_responses_count_check CHECK (responses_count >= 0),
  CONSTRAINT surveys_total_views_check CHECK (total_views >= 0),
  CONSTRAINT surveys_completion_rate_check CHECK (completion_rate >= 0 AND completion_rate <= 100),
  CONSTRAINT surveys_sentiment_score_check CHECK (sentiment_score >= -1 AND sentiment_score <= 1)
);

-- =====================================================
-- 3. QUESTIONS TABLE
-- =====================================================
CREATE TABLE public.questions (
  question_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  placeholder_text TEXT,
  min_length INTEGER,
  max_length INTEGER,
  validation_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Analytics fields
  response_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0, -- in seconds
  
  CONSTRAINT questions_pkey PRIMARY KEY (question_id),
  CONSTRAINT questions_survey_id_fkey FOREIGN KEY (survey_id) 
    REFERENCES public.surveys(survey_id) ON DELETE CASCADE,
  CONSTRAINT questions_type_check CHECK (
    question_type IN ('MCQ', 'TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'RATING', 'YESNO', 'DROPDOWN', 'CHECKBOX', 'SLIDER')
  ),
  CONSTRAINT questions_order_index_check CHECK (order_index >= 0),
  CONSTRAINT questions_response_count_check CHECK (response_count >= 0),
  CONSTRAINT questions_skip_count_check CHECK (skip_count >= 0)
);

-- =====================================================
-- 4. RESPONSES TABLE
-- =====================================================
CREATE TABLE public.responses (
  response_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL,
  question_id UUID NOT NULL,
  session_id UUID NOT NULL, -- Groups responses from same user session
  answer_text TEXT NULL,
  selected_option TEXT NULL,
  selected_options JSONB NULL, -- For multi-select questions
  numeric_value DECIMAL NULL,
  rating_value INTEGER NULL,
  respondent_email TEXT NULL,
  respondent_name TEXT NULL,
  respondent_ip TEXT NULL,
  user_agent TEXT NULL,
  device_type TEXT,
  response_time_seconds INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Analytics fields
  sentiment_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  keywords JSONB,
  categories JSONB,
  
  CONSTRAINT responses_pkey PRIMARY KEY (response_id),
  CONSTRAINT responses_survey_id_fkey FOREIGN KEY (survey_id) 
    REFERENCES public.surveys(survey_id) ON DELETE CASCADE,
  CONSTRAINT responses_question_id_fkey FOREIGN KEY (question_id) 
    REFERENCES public.questions(question_id) ON DELETE CASCADE,
  CONSTRAINT responses_answer_check CHECK (
    (answer_text IS NOT NULL) OR
    (selected_option IS NOT NULL) OR
    (selected_options IS NOT NULL) OR
    (numeric_value IS NOT NULL) OR
    (rating_value IS NOT NULL)
  ),
  CONSTRAINT responses_rating_check CHECK (
    rating_value IS NULL OR (rating_value >= 1 AND rating_value <= 10)
  ),
  CONSTRAINT responses_sentiment_check CHECK (
    sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)
  ),
  CONSTRAINT responses_confidence_check CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  )
);

-- =====================================================
-- 5. RESPONSE SESSIONS TABLE
-- =====================================================
CREATE TABLE public.response_sessions (
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL,
  respondent_email TEXT NULL,
  respondent_name TEXT NULL,
  respondent_ip TEXT NULL,
  user_agent TEXT NULL,
  device_type TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  total_time_seconds INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_question_index INTEGER DEFAULT 0,
  
  CONSTRAINT response_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT response_sessions_survey_id_fkey FOREIGN KEY (survey_id) 
    REFERENCES public.surveys(survey_id) ON DELETE CASCADE,
  CONSTRAINT response_sessions_completion_check CHECK (
    completion_percentage >= 0 AND completion_percentage <= 100
  )
);

-- =====================================================
-- 6. SURVEY ANALYTICS TABLE
-- =====================================================
CREATE TABLE public.survey_analytics (
  analytics_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  starts_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  abandonment_rate DECIMAL(5,2) DEFAULT 0.00,
  average_completion_time INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  top_exit_question_id UUID NULL,
  device_breakdown JSONB,
  traffic_sources JSONB,
  
  CONSTRAINT survey_analytics_pkey PRIMARY KEY (analytics_id),
  CONSTRAINT survey_analytics_survey_id_fkey FOREIGN KEY (survey_id) 
    REFERENCES public.surveys(survey_id) ON DELETE CASCADE,
  CONSTRAINT survey_analytics_top_exit_fkey FOREIGN KEY (top_exit_question_id) 
    REFERENCES public.questions(question_id) ON DELETE SET NULL,
  CONSTRAINT survey_analytics_unique_survey_date UNIQUE (survey_id, date_recorded)
);

-- =====================================================
-- 7. ML INSIGHTS TABLE
-- =====================================================
CREATE TABLE public.ml_insights (
  insight_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT ml_insights_pkey PRIMARY KEY (insight_id),
  CONSTRAINT ml_insights_survey_id_fkey FOREIGN KEY (survey_id) 
    REFERENCES public.surveys(survey_id) ON DELETE CASCADE,
  CONSTRAINT ml_insights_type_check CHECK (
    insight_type IN ('sentiment', 'clustering', 'anomaly', 'prediction', 'pattern', 'summary')
  )
);

-- =====================================================
-- 8. PERFORMANCE INDEXES
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_tier);

-- Surveys indexes
CREATE INDEX idx_surveys_created_by ON public.surveys(created_by);
CREATE INDEX idx_surveys_created_at ON public.surveys(created_at DESC);
CREATE INDEX idx_surveys_status ON public.surveys(status);
CREATE INDEX idx_surveys_active ON public.surveys(is_active) WHERE is_active = true;
CREATE INDEX idx_surveys_public ON public.surveys(is_public) WHERE is_public = true;
CREATE INDEX idx_surveys_expires_at ON public.surveys(expires_at) WHERE expires_at IS NOT NULL;

-- Questions indexes
CREATE INDEX idx_questions_survey_id ON public.questions(survey_id);
CREATE INDEX idx_questions_order ON public.questions(survey_id, order_index);
CREATE INDEX idx_questions_type ON public.questions(question_type);

-- Responses indexes
CREATE INDEX idx_responses_survey_id ON public.responses(survey_id);
CREATE INDEX idx_responses_question_id ON public.responses(question_id);
CREATE INDEX idx_responses_session_id ON public.responses(session_id);
CREATE INDEX idx_responses_submitted_at ON public.responses(submitted_at DESC);
CREATE INDEX idx_responses_email ON public.responses(respondent_email) WHERE respondent_email IS NOT NULL;
CREATE INDEX idx_responses_sentiment ON public.responses(sentiment_score) WHERE sentiment_score IS NOT NULL;

-- Response sessions indexes
CREATE INDEX idx_response_sessions_survey_id ON public.response_sessions(survey_id);
CREATE INDEX idx_response_sessions_started_at ON public.response_sessions(started_at DESC);
CREATE INDEX idx_response_sessions_completed ON public.response_sessions(is_complete);

-- Analytics indexes
CREATE INDEX idx_survey_analytics_survey_id ON public.survey_analytics(survey_id);
CREATE INDEX idx_survey_analytics_date ON public.survey_analytics(date_recorded DESC);

-- ML insights indexes
CREATE INDEX idx_ml_insights_survey_id ON public.ml_insights(survey_id);
CREATE INDEX idx_ml_insights_type ON public.ml_insights(insight_type);
CREATE INDEX idx_ml_insights_generated_at ON public.ml_insights(generated_at DESC);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_insights ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Surveys policies
CREATE POLICY "Users can view own surveys" ON public.surveys
  FOR SELECT USING (
    created_by = auth.uid() OR 
    (is_public = true AND is_active = true)
  );

CREATE POLICY "Users can create surveys" ON public.surveys
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own surveys" ON public.surveys
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own surveys" ON public.surveys
  FOR DELETE USING (created_by = auth.uid());

-- Questions policies
CREATE POLICY "Users can view questions" ON public.questions
  FOR SELECT USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys 
      WHERE created_by = auth.uid() OR (is_public = true AND is_active = true)
    )
  );

CREATE POLICY "Users can manage own survey questions" ON public.questions
  FOR ALL USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE created_by = auth.uid()
    )
  );

-- Responses policies
CREATE POLICY "Survey owners can view responses" ON public.responses
  FOR SELECT USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit responses to active surveys" ON public.responses
  FOR INSERT WITH CHECK (
    survey_id IN (
      SELECT survey_id FROM public.surveys 
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Response sessions policies
CREATE POLICY "Survey owners can view sessions" ON public.response_sessions
  FOR SELECT USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can create sessions for active surveys" ON public.response_sessions
  FOR INSERT WITH CHECK (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE is_active = true
    )
  );

CREATE POLICY "Anyone can update own sessions" ON public.response_sessions
  FOR UPDATE USING (true); -- Sessions are identified by session_id, not user

-- Analytics policies
CREATE POLICY "Survey owners can view analytics" ON public.survey_analytics
  FOR ALL USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE created_by = auth.uid()
    )
  );

-- ML insights policies
CREATE POLICY "Survey owners can view insights" ON public.ml_insights
  FOR ALL USING (
    survey_id IN (
      SELECT survey_id FROM public.surveys WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- 10. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update survey counts and analytics
CREATE OR REPLACE FUNCTION update_survey_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'questions' THEN
      UPDATE public.surveys 
      SET questions_count = questions_count + 1,
          num_questions = num_questions + 1,
          updated_at = NOW()
      WHERE survey_id = NEW.survey_id;
    ELSIF TG_TABLE_NAME = 'responses' THEN
      UPDATE public.surveys 
      SET responses_count = responses_count + 1,
          updated_at = NOW()
      WHERE survey_id = NEW.survey_id;
      
      UPDATE public.questions
      SET response_count = response_count + 1
      WHERE question_id = NEW.question_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'questions' THEN
      UPDATE public.surveys 
      SET questions_count = questions_count - 1,
          num_questions = num_questions - 1,
          updated_at = NOW()
      WHERE survey_id = OLD.survey_id;
    ELSIF TG_TABLE_NAME = 'responses' THEN
      UPDATE public.surveys 
      SET responses_count = responses_count - 1,
          updated_at = NOW()
      WHERE survey_id = OLD.survey_id;
      
      UPDATE public.questions
      SET response_count = response_count - 1
      WHERE question_id = OLD.question_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate completion rates
CREATE OR REPLACE FUNCTION update_completion_rate()
RETURNS TRIGGER AS $$
DECLARE
  total_sessions INTEGER;
  completed_sessions INTEGER;
  new_rate DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO total_sessions
  FROM public.response_sessions
  WHERE survey_id = NEW.survey_id;
  
  SELECT COUNT(*) INTO completed_sessions
  FROM public.response_sessions
  WHERE survey_id = NEW.survey_id AND is_complete = true;
  
  IF total_sessions > 0 THEN
    new_rate := (completed_sessions::DECIMAL / total_sessions::DECIMAL) * 100;
    
    UPDATE public.surveys
    SET completion_rate = new_rate,
        updated_at = NOW()
    WHERE survey_id = NEW.survey_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CREATE TRIGGERS
-- =====================================================

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for count updates
CREATE TRIGGER update_survey_question_count
  AFTER INSERT OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_survey_counts();

CREATE TRIGGER update_survey_response_count
  AFTER INSERT OR DELETE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION update_survey_counts();

-- Trigger for completion rate updates
CREATE TRIGGER update_survey_completion_rate
  AFTER INSERT OR UPDATE ON public.response_sessions
  FOR EACH ROW EXECUTE FUNCTION update_completion_rate();

-- =====================================================
-- 12. INITIAL DATA AND VIEWS
-- =====================================================

-- Create view for survey overview
CREATE OR REPLACE VIEW public.survey_overview AS
SELECT 
  s.survey_id,
  s.topic,
  s.audience,
  s.status,
  s.questions_count,
  s.responses_count,
  s.completion_rate,
  s.created_at,
  s.updated_at,
  up.full_name as creator_name,
  up.email as creator_email
FROM public.surveys s
JOIN public.user_profiles up ON s.created_by = up.id
WHERE s.is_active = true;

-- Create view for response analytics
CREATE OR REPLACE VIEW public.response_analytics AS
SELECT 
  r.survey_id,
  r.question_id,
  q.question_text,
  q.question_type,
  COUNT(*) as response_count,
  AVG(r.response_time_seconds) as avg_response_time,
  AVG(r.sentiment_score) as avg_sentiment
FROM public.responses r
JOIN public.questions q ON r.question_id = q.question_id
GROUP BY r.survey_id, r.question_id, q.question_text, q.question_type;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================