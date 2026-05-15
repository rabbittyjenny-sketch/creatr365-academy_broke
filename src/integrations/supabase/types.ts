export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          id: string
          is_active: boolean
          kind: string
          slug: string
          sort_order: number
          summary: string
          target_url: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          slug: string
          sort_order?: number
          summary?: string
          target_url: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          slug?: string
          sort_order?: number
          summary?: string
          target_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          module_id: string | null
          note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          score: number | null
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          module_id?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          amount_paid: number | null
          course_id: string
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          promo_code_id: string | null
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          course_id: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          promo_code_id?: string | null
          status?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          course_id?: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          promo_code_id?: string | null
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          code: string
          course_id: string
          created_at: string
          duration_label: string | null
          has_assignment: boolean
          has_quiz: boolean
          id: string
          is_test: boolean
          name: string
          phase: string
          sort_order: number
          summary: string | null
          updated_at: string
          vod_url: string | null
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          duration_label?: string | null
          has_assignment?: boolean
          has_quiz?: boolean
          id?: string
          is_test?: boolean
          name: string
          phase?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
          vod_url?: string | null
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          duration_label?: string | null
          has_assignment?: boolean
          has_quiz?: boolean
          id?: string
          is_test?: boolean
          name?: string
          phase?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
          vod_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          module_id: string | null
          pass_threshold: number
          phase: string
          qg_code: string | null
          source_ref: string | null
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          pass_threshold?: number
          phase?: string
          qg_code?: string | null
          source_ref?: string | null
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          pass_threshold?: number
          phase?: string
          qg_code?: string | null
          source_ref?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          bloom_level: string | null
          color: string
          cover_image_url: string | null
          created_at: string
          deliverables: string[]
          description: string
          duration: string
          features: string[]
          format_label: string | null
          gallery_image_urls: string[]
          id: string
          intro_video_url: string | null
          is_active: boolean
          kpi_notes: Json
          learning_type: string
          level: string | null
          max_slots: number | null
          outcome_goal: string | null
          price: string
          slug: string
          sort_order: number
          status: string
          stripe_price_id: string | null
          subtitle: string
          tag: string
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bloom_level?: string | null
          color?: string
          cover_image_url?: string | null
          created_at?: string
          deliverables?: string[]
          description?: string
          duration?: string
          features?: string[]
          format_label?: string | null
          gallery_image_urls?: string[]
          id?: string
          intro_video_url?: string | null
          is_active?: boolean
          kpi_notes?: Json
          learning_type?: string
          level?: string | null
          max_slots?: number | null
          outcome_goal?: string | null
          price?: string
          slug: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          subtitle?: string
          tag?: string
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bloom_level?: string | null
          color?: string
          cover_image_url?: string | null
          created_at?: string
          deliverables?: string[]
          description?: string
          duration?: string
          features?: string[]
          format_label?: string | null
          gallery_image_urls?: string[]
          id?: string
          intro_video_url?: string | null
          is_active?: boolean
          kpi_notes?: Json
          learning_type?: string
          level?: string | null
          max_slots?: number | null
          outcome_goal?: string | null
          price?: string
          slug?: string
          sort_order?: number
          status?: string
          stripe_price_id?: string | null
          subtitle?: string
          tag?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostic_quiz_results: {
        Row: {
          age_band: string | null
          created_at: string
          gaps: string[]
          gender: string | null
          id: string
          interest: string | null
          occupation: string | null
          per_qg_scores: Json
          province: string | null
          recommended_courses: string[]
          referrer: string | null
          strengths: string[]
          total_score: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          age_band?: string | null
          created_at?: string
          gaps?: string[]
          gender?: string | null
          id?: string
          interest?: string | null
          occupation?: string | null
          per_qg_scores?: Json
          province?: string | null
          recommended_courses?: string[]
          referrer?: string | null
          strengths?: string[]
          total_score?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          age_band?: string | null
          created_at?: string
          gaps?: string[]
          gender?: string | null
          id?: string
          interest?: string | null
          occupation?: string | null
          per_qg_scores?: Json
          province?: string | null
          recommended_courses?: string[]
          referrer?: string | null
          strengths?: string[]
          total_score?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      enrollment_notes: {
        Row: {
          author_id: string
          created_at: string
          enrollment_id: string
          id: string
          note: string
        }
        Insert: {
          author_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          background_image_url: string
          created_by: string
          creator: string
          date: string
          description: string
          id: string
          target_date: string
          time: string
          title: string
        }
        Insert: {
          address: string
          background_image_url: string
          created_by?: string
          creator: string
          date: string
          description: string
          id?: string
          target_date: string
          time: string
          title: string
        }
        Update: {
          address?: string
          background_image_url?: string
          created_by?: string
          creator?: string
          date?: string
          description?: string
          id?: string
          target_date?: string
          time?: string
          title?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          line_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          line_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          line_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          course_id: string | null
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer: string | null
          created_at: string
          explanation: string | null
          id: string
          options: Json
          prompt: string
          q_no: number
          quiz_id: string
          type: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          prompt: string
          q_no: number
          quiz_id: string
          type?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          prompt?: string
          q_no?: number
          quiz_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_used: { Args: { promo_id: string }; Returns: undefined }
      unlock_next_module: {
        Args: { _module_id: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
