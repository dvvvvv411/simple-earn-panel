-- Create user_activity_sessions table for tracking online activity
CREATE TABLE public.user_activity_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_user_id ON public.user_activity_sessions(user_id);
CREATE INDEX idx_activity_is_active ON public.user_activity_sessions(is_active);
CREATE INDEX idx_activity_started_at ON public.user_activity_sessions(started_at DESC);
CREATE INDEX idx_activity_user_active ON public.user_activity_sessions(user_id, is_active);

-- Enable RLS
ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_activity_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_activity_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_activity_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_activity_sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));