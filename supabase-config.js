// supabase-config.js
// Configuration file for Supabase connection

// IMPORTANT: Replace these with your actual Supabase project credentials
// Get these from: https://supabase.com/dashboard/project/_/settings/api

export const SUPABASE_URL = 'https://gnlyqkvyltbnpqtbqzkn.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubHlxa3Z5bHRibnBxdGJxemtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODY3NjEsImV4cCI6MjA3ODc2Mjc2MX0.ImWXF3Whbo8vaGyDDEx77t75eulh-zVVRJjyeKmHSVQ';

// Import Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* 
DATABASE SCHEMA SETUP:
Run these SQL commands in your Supabase SQL Editor to create the required tables:

-- 1. Questions Table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  category VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('mudah', 'sedang', 'sulit')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Invitation Codes Table
CREATE TABLE invitation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  participant_name VARCHAR(255),
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Test Sessions Table
CREATE TABLE test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_code VARCHAR(50) REFERENCES invitation_codes(code),
  participant_name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  score INTEGER,
  total_questions INTEGER,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Test Answers Table
CREATE TABLE test_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 5. Admin Users Table (for authentication)
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX idx_test_sessions_code ON test_sessions(invitation_code);
CREATE INDEX idx_test_answers_session ON test_answers(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security needs)
-- Allow public read access to questions during active test
CREATE POLICY "Allow authenticated access to questions" ON questions
  FOR SELECT USING (true);

-- Allow insert/update for test sessions
CREATE POLICY "Allow insert test sessions" ON test_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own test session" ON test_sessions
  FOR UPDATE USING (true);

-- Allow read test sessions for participants
CREATE POLICY "Allow read test sessions" ON test_sessions
  FOR SELECT USING (true);

-- Allow insert test answers
CREATE POLICY "Allow insert test answers" ON test_answers
  FOR INSERT WITH CHECK (true);

-- Allow read invitation codes
CREATE POLICY "Allow read invitation codes" ON invitation_codes
  FOR SELECT USING (true);

-- Allow update invitation codes when used
CREATE POLICY "Allow update invitation codes" ON invitation_codes
  FOR UPDATE USING (true);
*/
