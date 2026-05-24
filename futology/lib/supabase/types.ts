/**
 * Hand-typed Supabase schema. Mirrors `PROJECT_Sick-Boy.md` §6 column for
 * column. Replace by running:
 *
 *     npx supabase gen types typescript --project-id "<project-id>" \
 *         --schema public > lib/supabase/types.ts
 *
 * once the Supabase project exists and the schema from
 * `supabase/schema.sql` has been applied.
 */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export type Winner = "home" | "draw" | "away";

export type NotificationType =
  | "match_start"
  | "goal"
  | "transfer"
  | "prediction_settled"
  | "league_invite";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          country: string | null;
          notifications_enabled: boolean;
          email_notifications: boolean;
          match_start_alerts: boolean;
          goal_alerts: boolean;
          transfer_alerts: boolean;
          weekly_digest: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      user_followed_leagues: {
        Row: {
          id: string;
          user_id: string;
          league_id: number;
          league_name: string;
          league_logo: string | null;
          country: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_followed_leagues"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_followed_leagues"]["Row"]>;
      };
      user_followed_clubs: {
        Row: {
          id: string;
          user_id: string;
          team_id: number;
          team_name: string;
          team_logo: string | null;
          league_id: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_followed_clubs"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_followed_clubs"]["Row"]>;
      };
      user_followed_players: {
        Row: {
          id: string;
          user_id: string;
          player_id: number;
          player_name: string;
          player_photo: string | null;
          team_name: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_followed_players"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_followed_players"]["Row"]>;
      };
      user_followed_tournaments: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: number;
          tournament_name: string;
          tournament_logo: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_followed_tournaments"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_followed_tournaments"]["Row"]>;
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          fixture_id: number;
          home_team: string;
          away_team: string;
          match_date: string;
          predicted_home_score: number | null;
          predicted_away_score: number | null;
          predicted_winner: Winner | null;
          actual_home_score: number | null;
          actual_away_score: number | null;
          points_earned: number;
          ml_suggested_winner: Winner | null;
          ml_confidence: number | null;
          is_settled: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["predictions"]["Row"],
          "id" | "created_at" | "points_earned" | "is_settled"
        > & {
          id?: string;
          created_at?: string;
          points_earned?: number;
          is_settled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["predictions"]["Row"]>;
      };
      prediction_leagues: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          created_by: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["prediction_leagues"]["Row"],
          "id" | "created_at" | "invite_code"
        > & { id?: string; created_at?: string; invite_code?: string };
        Update: Partial<Database["public"]["Tables"]["prediction_leagues"]["Row"]>;
      };
      prediction_league_members: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          total_points: number;
          total_predictions: number;
          correct_predictions: number;
          joined_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["prediction_league_members"]["Row"],
          "id" | "joined_at" | "total_points" | "total_predictions" | "correct_predictions"
        > & {
          id?: string;
          joined_at?: string;
          total_points?: number;
          total_predictions?: number;
          correct_predictions?: number;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_league_members"]["Row"]>;
      };
      community_polls: {
        Row: {
          id: string;
          league_id: number | null;
          season: number | null;
          question: string;
          options: Json;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["community_polls"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["community_polls"]["Row"]>;
      };
      poll_votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          option_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["poll_votes"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["poll_votes"]["Row"]>;
      };
      ml_match_predictions: {
        Row: {
          id: string;
          fixture_id: number;
          home_team: string;
          away_team: string;
          match_date: string;
          home_win_prob: number | null;
          draw_prob: number | null;
          away_win_prob: number | null;
          predicted_winner: Winner | null;
          confidence: number | null;
          predicted_score: string | null;
          key_factors: Json | null;
          model_version: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ml_match_predictions"]["Row"],
          "id" | "created_at" | "model_version"
        > & { id?: string; created_at?: string; model_version?: string };
        Update: Partial<Database["public"]["Tables"]["ml_match_predictions"]["Row"]>;
      };
      ml_transfer_values: {
        Row: {
          id: string;
          player_id: number;
          predicted_value_eur: number | null;
          low_estimate: number | null;
          high_estimate: number | null;
          shap_explanations: Json | null;
          comparable_players: Json | null;
          computed_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ml_transfer_values"]["Row"],
          "id" | "computed_at"
        > & { id?: string; computed_at?: string };
        Update: Partial<Database["public"]["Tables"]["ml_transfer_values"]["Row"]>;
      };
      match_sentiment_snapshots: {
        Row: {
          id: string;
          fixture_id: number;
          match_minute: number | null;
          home_sentiment: number | null;
          away_sentiment: number | null;
          neutral_pct: number | null;
          excitement_score: number | null;
          total_posts: number | null;
          dominant_emotion: string | null;
          trending_words: Json | null;
          sample_comments: Json | null;
          snapshot_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["match_sentiment_snapshots"]["Row"],
          "id" | "snapshot_at"
        > & { id?: string; snapshot_at?: string };
        Update: Partial<Database["public"]["Tables"]["match_sentiment_snapshots"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at" | "is_read"
        > & { id?: string; created_at?: string; is_read?: boolean };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
