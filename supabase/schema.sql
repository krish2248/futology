-- FUTOLOGY Supabase schema — bible §6 verbatim.
--
-- Apply this in the Supabase SQL editor (Project > SQL > New query).
-- Run as a single batch; the order matters because RLS policies
-- reference tables that must exist first. See
-- `docs/SUPABASE_CUTOVER.md` for the full walkthrough.
--
-- After applying, regenerate `lib/supabase/types.ts` with:
--   npx supabase gen types typescript --project-id "<project-id>" \
--       --schema public > futology/lib/supabase/types.ts

-- ====================
-- PROFILES
-- ====================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  match_start_alerts BOOLEAN DEFAULT true,
  goal_alerts BOOLEAN DEFAULT true,
  transfer_alerts BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- USER PREFERENCES
-- ====================
CREATE TABLE user_followed_leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  league_id INTEGER NOT NULL,
  league_name TEXT NOT NULL,
  league_logo TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

CREATE TABLE user_followed_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  league_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

CREATE TABLE user_followed_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  player_photo TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

CREATE TABLE user_followed_tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL,
  tournament_name TEXT NOT NULL,
  tournament_logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);

-- ====================
-- USER PREDICTIONS
-- ====================
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fixture_id INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  predicted_winner TEXT,        -- 'home' | 'draw' | 'away'
  actual_home_score INTEGER,
  actual_away_score INTEGER,
  points_earned INTEGER DEFAULT 0,
  ml_suggested_winner TEXT,
  ml_confidence DECIMAL(5,2),
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fixture_id)
);

-- ====================
-- PREDICTION LEAGUES
-- ====================
CREATE TABLE prediction_leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prediction_league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES prediction_leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- ====================
-- COMMUNITY POLLS
-- ====================
CREATE TABLE community_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id INTEGER,
  season INTEGER,
  question TEXT NOT NULL,
  options JSONB NOT NULL,         -- [{ id: 'team_33', label: 'Man Utd', team_logo: '...' }]
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES community_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ====================
-- ML CACHES
-- ====================
CREATE TABLE ml_match_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  home_win_prob DECIMAL(5,2),
  draw_prob DECIMAL(5,2),
  away_win_prob DECIMAL(5,2),
  predicted_winner TEXT,
  confidence DECIMAL(5,2),
  predicted_score TEXT,
  key_factors JSONB,
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ml_transfer_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id INTEGER NOT NULL UNIQUE,
  predicted_value_eur BIGINT,
  low_estimate BIGINT,
  high_estimate BIGINT,
  shap_explanations JSONB,
  comparable_players JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- SENTIMENT
-- ====================
CREATE TABLE match_sentiment_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL,
  match_minute INTEGER,
  home_sentiment DECIMAL(5,2),
  away_sentiment DECIMAL(5,2),
  neutral_pct DECIMAL(5,2),
  excitement_score DECIMAL(5,2),
  total_posts INTEGER,
  dominant_emotion TEXT,
  trending_words JSONB,
  sample_comments JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_fixture ON match_sentiment_snapshots(fixture_id, snapshot_at DESC);

-- ====================
-- NOTIFICATIONS
-- ====================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,             -- 'match_start' | 'goal' | 'transfer' | 'prediction_settled' | 'league_invite'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- ====================
-- ROW LEVEL SECURITY
-- ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_transfer_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sentiment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Followed-* policies (own data only)
CREATE POLICY "Own leagues" ON user_followed_leagues FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own clubs" ON user_followed_clubs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own players" ON user_followed_players FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own tournaments" ON user_followed_tournaments FOR ALL USING (auth.uid() = user_id);

-- Predictions
CREATE POLICY "Own predictions" ON predictions FOR ALL USING (auth.uid() = user_id);

-- Prediction leagues
CREATE POLICY "View public or own leagues" ON prediction_leagues FOR SELECT
  USING (is_public OR created_by = auth.uid() OR id IN (
    SELECT league_id FROM prediction_league_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Create league" ON prediction_leagues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Own league members" ON prediction_league_members FOR ALL USING (auth.uid() = user_id);

-- Polls (public read, vote = own)
CREATE POLICY "Anyone reads polls" ON community_polls FOR SELECT USING (true);
CREATE POLICY "Own votes" ON poll_votes FOR ALL USING (auth.uid() = user_id);

-- ML caches: anyone reads
CREATE POLICY "Anyone reads ML predictions" ON ml_match_predictions FOR SELECT USING (true);
CREATE POLICY "Anyone reads transfer values" ON ml_transfer_values FOR SELECT USING (true);
CREATE POLICY "Anyone reads sentiment" ON match_sentiment_snapshots FOR SELECT USING (true);

-- Notifications
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ====================
-- TRIGGERS
-- ====================
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_timestamp BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================
-- REALTIME PUBLICATIONS
-- ====================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE match_sentiment_snapshots;
