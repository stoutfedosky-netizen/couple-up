export type IslanderStatus = "active" | "dumped" | "bombshell";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Islander {
  id: number;
  name: string;
  age: number;
  hometown: string;
  photo_url: string | null;
  status: IslanderStatus;
  entered_week: number;
  exited_week: number | null;
  created_at: string;
}

export interface Week {
  id: number;
  week_number: number;
  prediction_deadline: string;
  is_resolved: boolean;
  created_at: string;
}

export interface ActualCouple {
  id: number;
  week_id: number;
  islander_1_id: number;
  islander_2_id: number;
}

export interface ActualDumping {
  id: number;
  week_id: number;
  islander_id: number;
}

export interface Prediction {
  id: number;
  user_id: string;
  week_id: number;
  submitted_at: string;
  is_locked: boolean;
}

export interface PredictedCouple {
  id: number;
  prediction_id: number;
  islander_1_id: number;
  islander_2_id: number;
}

export interface PredictedDumping {
  id: number;
  prediction_id: number;
  islander_id: number;
}

export interface BonusQuestion {
  id: number;
  week_id: number;
  question_text: string;
  correct_answer: boolean | null;
}

export interface BonusAnswer {
  id: number;
  prediction_id: number;
  question_id: number;
  user_answer: boolean;
}

export interface Score {
  id: number;
  user_id: string;
  week_id: number;
  couple_pts: number;
  dump_pts: number;
  bonus_pts: number;
  perfect_bonus: number;
  streak_bonus: number;
  total: number;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  created_at: string;
}

export interface LeagueMember {
  id: number;
  league_id: string;
  user_id: string;
  joined_at: string;
}

export interface SeasonWinnerPrediction {
  id: number;
  user_id: string;
  islander_1_id: number;
  islander_2_id: number;
  predicted_at: string;
}

export interface Comment {
  id: number;
  user_id: string;
  week_id: number;
  content: string;
  created_at: string;
}

export interface DailyBonusQuestion {
  id: number;
  week_id: number;
  question_text: string;
  episode_date: string;
  deadline: string;
  correct_answer: boolean | null;
  created_at: string;
}

export interface DailyBonusAnswer {
  id: number;
  question_id: number;
  user_id: string;
  user_answer: boolean;
  answered_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      islanders: {
        Row: Islander;
        Insert: Omit<Islander, "id" | "created_at"> & { id?: number; created_at?: string };
        Update: Partial<Islander>;
      };
      weeks: {
        Row: Week;
        Insert: Omit<Week, "id" | "created_at" | "is_resolved"> & {
          id?: number;
          created_at?: string;
          is_resolved?: boolean;
        };
        Update: Partial<Week>;
      };
      actual_couples: {
        Row: ActualCouple;
        Insert: Omit<ActualCouple, "id"> & { id?: number };
        Update: Partial<ActualCouple>;
      };
      actual_dumpings: {
        Row: ActualDumping;
        Insert: Omit<ActualDumping, "id"> & { id?: number };
        Update: Partial<ActualDumping>;
      };
      predictions: {
        Row: Prediction;
        Insert: Omit<Prediction, "id" | "submitted_at" | "is_locked"> & {
          id?: number;
          submitted_at?: string;
          is_locked?: boolean;
        };
        Update: Partial<Prediction>;
      };
      predicted_couples: {
        Row: PredictedCouple;
        Insert: Omit<PredictedCouple, "id"> & { id?: number };
        Update: Partial<PredictedCouple>;
      };
      predicted_dumpings: {
        Row: PredictedDumping;
        Insert: Omit<PredictedDumping, "id"> & { id?: number };
        Update: Partial<PredictedDumping>;
      };
      bonus_questions: {
        Row: BonusQuestion;
        Insert: Omit<BonusQuestion, "id" | "correct_answer"> & {
          id?: number;
          correct_answer?: boolean | null;
        };
        Update: Partial<BonusQuestion>;
      };
      bonus_answers: {
        Row: BonusAnswer;
        Insert: Omit<BonusAnswer, "id"> & { id?: number };
        Update: Partial<BonusAnswer>;
      };
      scores: {
        Row: Score;
        Insert: Omit<Score, "id" | "couple_pts" | "dump_pts" | "bonus_pts" | "perfect_bonus" | "streak_bonus" | "total"> & {
          id?: number;
          couple_pts?: number;
          dump_pts?: number;
          bonus_pts?: number;
          perfect_bonus?: number;
          streak_bonus?: number;
          total?: number;
        };
        Update: Partial<Score>;
      };
      leagues: {
        Row: League;
        Insert: Omit<League, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<League>;
      };
      league_members: {
        Row: LeagueMember;
        Insert: Omit<LeagueMember, "id" | "joined_at"> & { id?: number; joined_at?: string };
        Update: Partial<LeagueMember>;
      };
      season_winner_predictions: {
        Row: SeasonWinnerPrediction;
        Insert: Omit<SeasonWinnerPrediction, "id" | "predicted_at"> & {
          id?: number;
          predicted_at?: string;
        };
        Update: Partial<SeasonWinnerPrediction>;
      };
      daily_bonus_questions: {
        Row: DailyBonusQuestion;
        Insert: Omit<DailyBonusQuestion, "id" | "created_at" | "correct_answer"> & {
          id?: number;
          created_at?: string;
          correct_answer?: boolean | null;
        };
        Update: Partial<DailyBonusQuestion>;
      };
      daily_bonus_answers: {
        Row: DailyBonusAnswer;
        Insert: Omit<DailyBonusAnswer, "id" | "answered_at"> & {
          id?: number;
          answered_at?: string;
        };
        Update: Partial<DailyBonusAnswer>;
      };
    };
  };
}
