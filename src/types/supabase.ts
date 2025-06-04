export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          member_id: string | null
          reason: string | null
          type: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          reason?: string | null
          type?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          reason?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_workouts: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          week: number
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          week: number
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          week?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assigned_workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "recommended_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      body_compositions: {
        Row: {
          bmi: number | null
          body_fat_percent: number | null
          created_at: string | null
          date: string
          id: string
          member_id: string | null
          muscle_mass: number | null
          weight: number | null
        }
        Insert: {
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string | null
          date: string
          id?: string
          member_id?: string | null
          muscle_mass?: number | null
          weight?: number | null
        }
        Update: {
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string | null
          date?: string
          id?: string
          member_id?: string | null
          muscle_mass?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_compositions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      center_announcements: {
        Row: {
          content: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          link_url: string | null
          start_date: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          start_date?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          start_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      conditions: {
        Row: {
          created_at: string | null
          energy_score: number | null
          id: string
          member_id: string | null
          pain_score: number | null
          sleep_score: number | null
        }
        Insert: {
          created_at?: string | null
          energy_score?: number | null
          id?: string
          member_id?: string | null
          pain_score?: number | null
          sleep_score?: number | null
        }
        Update: {
          created_at?: string | null
          energy_score?: number | null
          id?: string
          member_id?: string | null
          pain_score?: number | null
          sleep_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conditions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_videos: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          id: string
          tags: string[] | null
          title: string | null
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          video_url?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comment: string | null
          created_at: string | null
          date: string
          has_pain: boolean | null
          id: string
          member_id: string | null
          satisfaction: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          date: string
          has_pain?: boolean | null
          id?: string
          member_id?: string | null
          satisfaction?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          date?: string
          has_pain?: boolean | null
          id?: string
          member_id?: string | null
          satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_rewards: {
        Row: {
          id: string
          member_id: string
          reward_level: number
          reward_month: string
          rewarded_at: string | null
        }
        Insert: {
          id?: string
          member_id: string
          reward_level: number
          reward_month: string
          rewarded_at?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          reward_level?: number
          reward_month?: string
          rewarded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_rewards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_pain_logs: {
        Row: {
          activity: string | null
          created_at: string | null
          date: string
          id: string
          member_id: string | null
          note: string | null
          pain_area: string | null
          pain_score: number | null
        }
        Insert: {
          activity?: string | null
          created_at?: string | null
          date: string
          id?: string
          member_id?: string | null
          note?: string | null
          pain_area?: string | null
          pain_score?: number | null
        }
        Update: {
          activity?: string | null
          created_at?: string | null
          date?: string
          id?: string
          member_id?: string | null
          note?: string | null
          pain_area?: string | null
          pain_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_pain_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_recommendations: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          id: string
          is_completed: boolean | null
          member_id: string | null
          recommendation_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          recommendation_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          recommendation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_recommendations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "exercise_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          name: string
          phone_last4: string
          score: number | null
          segment: string | null
          trainer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          name: string
          phone_last4: string
          score?: number | null
          segment?: string | null
          trainer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string
          phone_last4?: string
          score?: number | null
          segment?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_trainer"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_logs: {
        Row: {
          assigned_month: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          member_id: string | null
          mission_id: string | null
        }
        Insert: {
          assigned_month?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          mission_id?: string | null
        }
        Update: {
          assigned_month?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          mission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "monthly_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_missions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      pain_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          member_id: string | null
          pain_area: string | null
          pain_score: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          member_id?: string | null
          pain_area?: string | null
          pain_score?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          member_id?: string | null
          pain_area?: string | null
          pain_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_workouts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          video_url: string
          week: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          video_url: string
          week: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          video_url?: string
          week?: number
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          completed: boolean
          created_at: string | null
          date: string
          day: number
          id: string
          member_id: string
          updated_at: string | null
          week_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          date: string
          day: number
          id?: string
          member_id: string
          updated_at?: string | null
          week_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          date?: string
          day?: number
          id?: string
          member_id?: string
          updated_at?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      score_logs: {
        Row: {
          member_id: string
          month: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          member_id: string
          month: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          member_id?: string
          month?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_notes: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          note: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          note?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      watch_progress_logs: {
        Row: {
          id: string
          member_id: string
          seconds: number
          updated_at: string | null
          video_url: string
        }
        Insert: {
          id?: string
          member_id: string
          seconds: number
          updated_at?: string | null
          video_url: string
        }
        Update: {
          id?: string
          member_id?: string
          seconds?: number
          updated_at?: string | null
          video_url?: string
        }
        Relationships: []
      }
      weekly_missions: {
        Row: {
          description: string | null
          id: string
          title: string | null
          video_url: string | null
          week: number
        }
        Insert: {
          description?: string | null
          id?: string
          title?: string | null
          video_url?: string | null
          week: number
        }
        Update: {
          description?: string | null
          id?: string
          title?: string | null
          video_url?: string | null
          week?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_completed: boolean | null
          member_id: string | null
          pain_score: number | null
          type: string | null
          video_url: string | null
          week: number | null
          workout_notes: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          pain_score?: number | null
          type?: string | null
          video_url?: string | null
          week?: number | null
          workout_notes?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          pain_score?: number | null
          type?: string | null
          video_url?: string | null
          week?: number | null
          workout_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string | null
          feedback: string | null
          id: string
          member_id: string | null
          pain_score: number | null
          title: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date?: string | null
          feedback?: string | null
          id?: string
          member_id?: string | null
          pain_score?: number | null
          title?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string | null
          feedback?: string | null
          id?: string
          member_id?: string | null
          pain_score?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_score: {
        Args: { member_id_input: string; point: number }
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
