-- Supabase Database Schema for ModelPulse
-- Run these statements in the Supabase SQL Editor to initialize your database tables.

-- 1. Create Providers Table
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Models Table
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  release_date TEXT,
  current_status TEXT CHECK (current_status IN ('available', 'restricted', 'deprecated', 'limited_rollout')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES models(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('launch', 'update', 'deprecation', 'restriction', 'pricing_change')) NOT NULL,
  summary TEXT NOT NULL,
  raw_source_text TEXT,
  source_url TEXT,
  published_date TEXT NOT NULL,
  impact_score TEXT CHECK (impact_score IN ('major', 'minor')) NOT NULL,
  region_affected TEXT,
  is_verified BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Users Table (integrates with Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('viewer', 'admin')) DEFAULT 'viewer' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Pending Articles Table (for incoming RSS feeds prior to approval)
CREATE TABLE IF NOT EXISTS pending_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  article_text TEXT NOT NULL,
  source_url TEXT,
  published_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) configuration (Optional but recommended for Supabase)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_articles ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public read access to providers, models, and events)
CREATE POLICY "Allow public read access to providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to models" ON models FOR SELECT USING (true);
CREATE POLICY "Allow public read access to events" ON events FOR SELECT USING (true);

-- Create Policies (Admins can perform write actions)
CREATE POLICY "Allow admin write access to providers" ON providers ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Allow admin write access to models" ON models ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Allow admin write access to events" ON events ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Allow admin write access to pending_articles" ON pending_articles ALL 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- User profile triggers (automaticaly inserts a record when a new auth user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
