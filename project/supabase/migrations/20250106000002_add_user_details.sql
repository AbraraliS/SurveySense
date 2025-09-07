-- Add user details fields to responses and response_sessions tables
-- =====================================================

-- Add age and occupation fields to responses table
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS respondent_age INTEGER NULL,
ADD COLUMN IF NOT EXISTS respondent_occupation TEXT NULL;

-- Add age and occupation fields to response_sessions table  
ALTER TABLE public.response_sessions
ADD COLUMN IF NOT EXISTS respondent_age INTEGER NULL,
ADD COLUMN IF NOT EXISTS respondent_occupation TEXT NULL;

-- Add constraints for age field (drop first if exists to avoid errors)
DO $$ 
BEGIN
    -- Drop constraint if it exists for responses table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'responses_age_check' 
               AND table_name = 'responses' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.responses DROP CONSTRAINT responses_age_check;
    END IF;
    
    -- Drop constraint if it exists for response_sessions table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'response_sessions_age_check' 
               AND table_name = 'response_sessions' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.response_sessions DROP CONSTRAINT response_sessions_age_check;
    END IF;
END $$;

-- Add constraints for age field
ALTER TABLE public.responses 
ADD CONSTRAINT responses_age_check CHECK (
  respondent_age IS NULL OR (respondent_age >= 1 AND respondent_age <= 120)
);

ALTER TABLE public.response_sessions 
ADD CONSTRAINT response_sessions_age_check CHECK (
  respondent_age IS NULL OR (respondent_age >= 1 AND respondent_age <= 120)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_responses_age ON public.responses(respondent_age) WHERE respondent_age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_occupation ON public.responses(respondent_occupation) WHERE respondent_occupation IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_response_sessions_age ON public.response_sessions(respondent_age) WHERE respondent_age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_response_sessions_occupation ON public.response_sessions(respondent_occupation) WHERE respondent_occupation IS NOT NULL;
