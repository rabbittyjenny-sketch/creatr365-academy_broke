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
          author: string | null
          body: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_active: boolean
          kind: string
          meta_description: string | null
          slug: string
          sort_order: number
          summary: string
          tags: string[] | null
          target_url: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          meta_description?: string | null
          slug: string
          sort_order?: number
          summary?: string
          tags?: string[] | null
          target_url?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          meta_description?: string | null
          slug?: string
          sort_order?: number
          summary?: string
          tags?: string[] | null
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
          dimension_scores: Json | null
          id: string
          module_id: string | null
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          rubric_id: string | null
          score: number | null
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          dimension_scores?: Json | null
          id?: string
          module_id?: string | null
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          rubric_id?: string | null
          score?: number | null
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          dimension_scores?: Json | null
          id?: string
          module_id?: string | null
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          rubric_id?: string | null
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
      completion_records: {
        Row: {
          accepted_diagnostic_attempt_id: string | null
          all_mandatory_passed: boolean
          course_id: string
          id: string
          issued_at: string
          record_code: string
          user_id: string
        }
        Insert: {
          accepted_diagnostic_attempt_id?: string | null
          all_mandatory_passed: boolean
          course_id: string
          id?: string
          issued_at?: string
          record_code: string
          user_id: string
        }
        Update: {
          accepted_diagnostic_attempt_id?: string | null
          all_mandatory_passed?: boolean
          course_id?: string
          id?: string
          issued_at?: string
          record_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completion_records_accepted_diagnostic_attempt_id_fkey"
            columns: ["accepted_diagnostic_attempt_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
          onsite_session_label: string | null
          onsite_unlock_code: string | null
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
          onsite_session_label?: string | null
          onsite_unlock_code?: string | null
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
          onsite_session_label?: string | null
          onsite_unlock_code?: string | null
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
      course_resources: {
        Row: {
          course_id: string
          created_at: string
          file_name: string | null
          file_path: string
          id: string
          is_active: boolean
          resource_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_name?: string | null
          file_path: string
          id?: string
          is_active?: boolean
          resource_type?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_name?: string | null
          file_path?: string
          id?: string
          is_active?: boolean
          resource_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
          promo_price: string | null
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
          promo_price?: string | null
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
          promo_price?: string | null
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
      diagnostic_attempts: {
        Row: {
          accepted: boolean
          attempt_number: number
          course_id: string
          created_at: string
          id: string
          radar_breakdown: Json | null
          score_pct: number
          user_id: string
        }
        Insert: {
          accepted?: boolean
          attempt_number: number
          course_id: string
          created_at?: string
          id?: string
          radar_breakdown?: Json | null
          score_pct: number
          user_id: string
        }
        Update: {
          accepted?: boolean
          attempt_number?: number
          course_id?: string
          created_at?: string
          id?: string
          radar_breakdown?: Json | null
          score_pct?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      event_private_details: {
        Row: {
          attendee_info: string
          event_id: string
          online_url: string
          updated_at: string
        }
        Insert: {
          attendee_info?: string
          event_id: string
          online_url?: string
          updated_at?: string
        }
        Update: {
          attendee_info?: string
          event_id?: string
          online_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_private_details_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          admin_note: string
          decided_at: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          line_name: string
          note: string
          phone: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          decided_at?: string | null
          email?: string
          event_id: string
          full_name?: string
          id?: string
          line_name?: string
          note?: string
          phone?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          decided_at?: string | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          line_name?: string
          note?: string
          phone?: string
          registered_at?: string
          status?: string
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
          capacity: number | null
          created_by: string
          creator: string
          date: string
          description: string
          early_bird_price: number | null
          early_bird_until: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          location_type: string
          map_url: string
          price: number | null
          price_note: string
          registration_closes_at: string | null
          registration_opens_at: string | null
          target_date: string
          time: string
          title: string
          venue_name: string
        }
        Insert: {
          address?: string
          background_image_url?: string
          capacity?: number | null
          created_by?: string
          creator?: string
          date: string
          description?: string
          early_bird_price?: number | null
          early_bird_until?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          location_type?: string
          map_url?: string
          price?: number | null
          price_note?: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          target_date?: string
          time?: string
          title: string
          venue_name?: string
        }
        Update: {
          address?: string
          background_image_url?: string
          capacity?: number | null
          created_by?: string
          creator?: string
          date?: string
          description?: string
          early_bird_price?: number | null
          early_bird_until?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          location_type?: string
          map_url?: string
          price?: number | null
          price_note?: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          target_date?: string
          time?: string
          title?: string
          venue_name?: string
        }
        Relationships: []
      }
      lms_handoff_tokens: {
        Row: {
          course_slug: string | null
          created_at: string
          expires_at: string
          student_id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          course_slug?: string | null
          created_at?: string
          expires_at: string
          student_id: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          course_slug?: string | null
          created_at?: string
          expires_at?: string
          student_id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lms_lesson_state: {
        Row: {
          course_slug: string
          first_seen_at: string
          id: string
          lesson_code: string
          pretest_done: boolean
          student_id: string
          updated_at: string
          video_view_count: number
          video_watched: boolean
        }
        Insert: {
          course_slug: string
          first_seen_at?: string
          id?: string
          lesson_code: string
          pretest_done?: boolean
          student_id: string
          updated_at?: string
          video_view_count?: number
          video_watched?: boolean
        }
        Update: {
          course_slug?: string
          first_seen_at?: string
          id?: string
          lesson_code?: string
          pretest_done?: boolean
          student_id?: string
          updated_at?: string
          video_view_count?: number
          video_watched?: boolean
        }
        Relationships: []
      }
      mandatory_topic_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          passed: boolean
          score_pct: number
          topic_id: string
          user_id: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          id?: string
          passed: boolean
          score_pct: number
          topic_id: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          passed?: boolean
          score_pct?: number
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandatory_topic_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "mandatory_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mandatory_topics: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_pass_pct: number
          reference_source: string
          slot_code: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_pass_pct?: number
          reference_source: string
          slot_code: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_pass_pct?: number
          reference_source?: string
          slot_code?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          score: number | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          score?: number | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          score?: number | null
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
      onsite_code_redemptions: {
        Row: {
          id: string
          module_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          module_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          module_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onsite_code_redemptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      page_banners: {
        Row: {
          image_url: string | null
          page_key: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          image_url?: string | null
          page_key: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          image_url?: string | null
          page_key?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          gender: string | null
          id: string
          line_user_id: string | null
          occupation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          line_user_id?: string | null
          occupation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          line_user_id?: string | null
          occupation?: string | null
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
      purchase_events: {
        Row: {
          amount_final: number | null
          course_id: string | null
          created_at: string
          detail: Json
          discount_amount: number | null
          enrollment_id: string | null
          event: string
          id: string
          price_original: number | null
          promo_code_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_final?: number | null
          course_id?: string | null
          created_at?: string
          detail?: Json
          discount_amount?: number | null
          enrollment_id?: string | null
          event: string
          id?: string
          price_original?: number | null
          promo_code_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_final?: number | null
          course_id?: string | null
          created_at?: string
          detail?: Json
          discount_amount?: number | null
          enrollment_id?: string | null
          event?: string
          id?: string
          price_original?: number | null
          promo_code_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_events_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          correct: number | null
          course_id: string | null
          created_at: string
          id: string
          lesson_code: string | null
          module_id: string | null
          passed: boolean | null
          qg: string | null
          quiz_type: string
          score_pct: number | null
          student_id: string
          total: number | null
          user_id: string | null
        }
        Insert: {
          correct?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_code?: string | null
          module_id?: string | null
          passed?: boolean | null
          qg?: string | null
          quiz_type: string
          score_pct?: number | null
          student_id: string
          total?: number | null
          user_id?: string | null
        }
        Update: {
          correct?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_code?: string | null
          module_id?: string | null
          passed?: boolean | null
          qg?: string | null
          quiz_type?: string
          score_pct?: number | null
          student_id?: string
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_bank: {
        Row: {
          auto_gradable: boolean | null
          bloom_level: string | null
          choice_a: string | null
          choice_b: string | null
          choice_c: string | null
          choice_d: string | null
          correct_choice: string | null
          course_scheme: string | null
          created_at: string
          explanation: string | null
          is_active: boolean
          is_diagnostic: boolean
          legacy_ids: string[]
          model_answer: string | null
          pass_criteria: string | null
          phase: string
          progression_level: string | null
          q_id: string
          qg: string
          question: string
          question_set: string | null
          question_type: string
          recommended_courses: string[]
          sales_pitch: string | null
          skill_tags: string[]
          source: string
          updated_at: string
        }
        Insert: {
          auto_gradable?: boolean | null
          bloom_level?: string | null
          choice_a?: string | null
          choice_b?: string | null
          choice_c?: string | null
          choice_d?: string | null
          correct_choice?: string | null
          course_scheme?: string | null
          created_at?: string
          explanation?: string | null
          is_active?: boolean
          is_diagnostic?: boolean
          legacy_ids?: string[]
          model_answer?: string | null
          pass_criteria?: string | null
          phase: string
          progression_level?: string | null
          q_id: string
          qg: string
          question: string
          question_set?: string | null
          question_type: string
          recommended_courses?: string[]
          sales_pitch?: string | null
          skill_tags?: string[]
          source: string
          updated_at?: string
        }
        Update: {
          auto_gradable?: boolean | null
          bloom_level?: string | null
          choice_a?: string | null
          choice_b?: string | null
          choice_c?: string | null
          choice_d?: string | null
          correct_choice?: string | null
          course_scheme?: string | null
          created_at?: string
          explanation?: string | null
          is_active?: boolean
          is_diagnostic?: boolean
          legacy_ids?: string[]
          model_answer?: string | null
          pass_criteria?: string | null
          phase?: string
          progression_level?: string | null
          q_id?: string
          qg?: string
          question?: string
          question_set?: string | null
          question_type?: string
          recommended_courses?: string[]
          sales_pitch?: string | null
          skill_tags?: string[]
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_bank_qg_fkey"
            columns: ["qg"]
            isOneToOne: false
            referencedRelation: "quiz_groups"
            referencedColumns: ["qg"]
          },
        ]
      }
      quiz_groups: {
        Row: {
          name: string
          qg: string
          sort_order: number
        }
        Insert: {
          name: string
          qg: string
          sort_order?: number
        }
        Update: {
          name?: string
          qg?: string
          sort_order?: number
        }
        Relationships: []
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
      resource_download_logs: {
        Row: {
          consented: boolean
          course_id: string
          downloaded_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          consented?: boolean
          course_id: string
          downloaded_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          consented?: boolean
          course_id?: string
          downloaded_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_download_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_download_logs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "course_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      toolbox_assets: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string
          download_count: number
          file_name: string | null
          file_path: string
          file_type: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          download_count?: number
          file_name?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          download_count?: number
          file_name?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      toolbox_downloads: {
        Row: {
          age_range: string | null
          asset_id: string
          consented: boolean
          downloaded_at: string
          gender: string | null
          id: string
          occupation: string | null
          student_id: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          asset_id: string
          consented?: boolean
          downloaded_at?: string
          gender?: string | null
          id?: string
          occupation?: string | null
          student_id?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          asset_id?: string
          consented?: boolean
          downloaded_at?: string
          gender?: string | null
          id?: string
          occupation?: string | null
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_downloads_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "toolbox_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          email: string | null
          hash_algorithm: string
          id: string
          is_active: boolean
          line_user_id: string
          password_hash: string | null
          registered_at: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          email?: string | null
          hash_algorithm?: string
          id?: string
          is_active?: boolean
          line_user_id: string
          password_hash?: string | null
          registered_at?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          email?: string | null
          hash_algorithm?: string
          id?: string
          is_active?: boolean
          line_user_id?: string
          password_hash?: string | null
          registered_at?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      accept_diagnostic_attempt: {
        Args: { _attempt_id: string; _user_id: string }
        Returns: {
          accepted_diagnostic_attempt_id: string | null
          all_mandatory_passed: boolean
          course_id: string
          id: string
          issued_at: string
          record_code: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "completion_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_event_registration: {
        Args: { _event_id: string }
        Returns: undefined
      }
      ensure_master_student_account: {
        Args: { _email?: string }
        Returns: string
      }
      ensure_master_student_account_for_identity: {
        Args: { _email?: string; _line_user_id: string; _student_id?: string }
        Returns: string
      }
      event_confirmed_counts: {
        Args: { _event_ids: string[] }
        Returns: {
          confirmed: number
          event_id: string
        }[]
      }
      generate_master_student_id: { Args: { _seed: string }; Returns: string }
      has_passed_mandatory_gate: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_used: { Args: { promo_id: string }; Returns: undefined }
      increment_toolbox_download: {
        Args: { _asset_id: string }
        Returns: undefined
      }
      issue_completion_record: {
        Args: {
          _course_id: string
          _diagnostic_attempt_id: string
          _user_id: string
        }
        Returns: {
          accepted_diagnostic_attempt_id: string | null
          all_mandatory_passed: boolean
          course_id: string
          id: string
          issued_at: string
          record_code: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "completion_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      link_line_master_student_account: {
        Args: { _email?: string; _line_user_id: string; _student_id?: string }
        Returns: string
      }
      linked_user_ids: { Args: { _uid: string }; Returns: string[] }
      lms_touch_lesson_state: {
        Args: {
          _course_slug: string
          _increment_view?: boolean
          _lesson_code: string
          _student_id: string
          _watched?: boolean
        }
        Returns: undefined
      }
      my_linked_user_ids: { Args: never; Returns: string[] }
      normalize_master_student_id: {
        Args: { _student_id: string }
        Returns: string
      }
      request_event_registration: {
        Args: {
          _email: string
          _event_id: string
          _full_name: string
          _line_name: string
          _note?: string
          _phone: string
        }
        Returns: {
          admin_note: string
          decided_at: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          line_name: string
          note: string
          phone: string
          registered_at: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "event_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
