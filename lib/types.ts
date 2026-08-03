export type UiLanguage = "zh-CN" | "en";

export type UserRow = {
  id: string;
  handle: string;
  display_name: string;
  current_level: string;
  target_level: string | null;
  learning_phase: string;
  study_preference: Record<string, unknown>;
  ui_language: UiLanguage;
  goal_type?: string | null;
  daily_minutes?: number;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
};
