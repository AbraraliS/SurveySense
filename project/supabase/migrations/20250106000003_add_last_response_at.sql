-- Add last_response_at field to surveys table
-- =====================================================

-- Add last_response_at field to surveys table
ALTER TABLE public.surveys 
ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_surveys_last_response_at ON public.surveys(last_response_at) WHERE last_response_at IS NOT NULL;
