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
          member_id: string | null
          reason: string | null
          type: "personal" | "lesson" // ✅ 추가
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          reason?: string | null
          type: "personal" | "lesson" // ✅ 추가
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          reason?: string | null
          type?: "personal" | "lesson" // ✅ 추가
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
      members: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone_last4: string
          trainer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone_last4: string
          trainer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone_last4?: string
          trainer_id?: string
        }
        Relationships: []
      }
      mission_logs: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          member_id: string | null
          mission_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          mission_id?: string | null
        }
        Update: {
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
          month: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          month: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          month?: string
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
          pain_score: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          member_id?: string | null
          pain_score?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          member_id?: string | null
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
      workout_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_completed: boolean | null
          member_id: string | null
          pain_score: number | null
          workout_notes: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          pain_score?: number | null
          workout_notes?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_completed?: boolean | null
          member_id?: string | null
          pain_score?: number | null
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
          feedback: string | null
          id: string
          member_id: string | null
          pain_score: number | null
          title: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          member_id?: string | null
          pain_score?: number | null
          title?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
