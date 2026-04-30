/**
 * Database type definitions for FitTrack Pro
 * Based on the Supabase schema defined in Backend Backlog Iteration 2
 * These types mirror the PostgreSQL table structures and are compatible
 * with the Supabase client generics.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          age: number | null
          gender: 'férfi' | 'nő' | null
          weight: number | null
          height: number | null
          goal: 'fogyás' | 'izomnövelés' | 'erőnövelés' | 'egészség' | null
          activity_level: 'ülő' | 'mérsékelten_aktív' | 'aktív' | 'nagyon_aktív' | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          age?: number | null
          gender?: 'férfi' | 'nő' | null
          weight?: number | null
          height?: number | null
          goal?: 'fogyás' | 'izomnövelés' | 'erőnövelés' | 'egészség' | null
          activity_level?: 'ülő' | 'mérsékelten_aktív' | 'aktív' | 'nagyon_aktív' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          age?: number | null
          gender?: 'férfi' | 'nő' | null
          weight?: number | null
          height?: number | null
          goal?: 'fogyás' | 'izomnövelés' | 'erőnövelés' | 'egészség' | null
          activity_level?: 'ülő' | 'mérsékelten_aktív' | 'aktív' | 'nagyon_aktív' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name_hu: string
          name_en: string | null
          description_hu: string | null
          description_en: string | null
          category: string
          muscle_group: string
          secondary_muscles: string[] | null
          equipment: string | null
          difficulty: 'kezdő' | 'haladó' | 'profi'
          image_urls: string[] | null
          wger_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name_hu: string
          name_en?: string | null
          description_hu?: string | null
          description_en?: string | null
          category: string
          muscle_group: string
          secondary_muscles?: string[] | null
          equipment?: string | null
          difficulty: 'kezdő' | 'haladó' | 'profi'
          image_urls?: string[] | null
          wger_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name_hu?: string
          name_en?: string | null
          description_hu?: string | null
          description_en?: string | null
          category?: string
          muscle_group?: string
          secondary_muscles?: string[] | null
          equipment?: string | null
          difficulty?: 'kezdő' | 'haladó' | 'profi'
          image_urls?: string[] | null
          wger_id?: number | null
          created_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_days: {
        Row: {
          id: string
          plan_id: string
          day_name: string
          day_order: number
          day_of_week: number | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          day_name: string
          day_order: number
          day_of_week?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          day_name?: string
          day_order?: number
          day_of_week?: number | null
          created_at?: string
        }
      }
      workout_day_exercises: {
        Row: {
          id: string
          workout_day_id: string
          exercise_id: string
          sets: number
          reps: number
          rest_seconds: number | null
          exercise_order: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_day_id: string
          exercise_id: string
          sets: number
          reps: number
          rest_seconds?: number | null
          exercise_order: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_day_id?: string
          exercise_id?: string
          sets?: number
          reps?: number
          rest_seconds?: number | null
          exercise_order?: number
          notes?: string | null
          created_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          workout_completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          workout_completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          workout_completed?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      food_entries: {
        Row: {
          id: string
          daily_log_id: string
          name: string
          calories: number
          protein: number | null
          carbs: number | null
          fat: number | null
          serving_size: number | null
          serving_unit: string | null
          meal_type: 'reggeli' | 'tizórai' | 'ebéd' | 'uzsonna' | 'vacsora' | 'egyéb' | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_log_id: string
          name: string
          calories: number
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          meal_type?: 'reggeli' | 'tizórai' | 'ebéd' | 'uzsonna' | 'vacsora' | 'egyéb' | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_log_id?: string
          name?: string
          calories?: number
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          meal_type?: 'reggeli' | 'tizórai' | 'ebéd' | 'uzsonna' | 'vacsora' | 'egyéb' | null
          created_at?: string
        }
      }
      weight_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          weight: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          weight?: number
          notes?: string | null
          created_at?: string
        }
      }
      weekly_analyses: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          analysis_text: string
          workout_count: number | null
          avg_calories: number | null
          weight_change: number | null
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          analysis_text: string
          workout_count?: number | null
          avg_calories?: number | null
          weight_change?: number | null
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          analysis_text?: string
          workout_count?: number | null
          avg_calories?: number | null
          weight_change?: number | null
          generated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          image_url: string | null
          stock: number
          category: string | null
          stripe_product_id: string | null
          stripe_price_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          currency?: string
          image_url?: string | null
          stock?: number
          category?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          image_url?: string | null
          stock?: number
          category?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          currency: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          shipping_address: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          currency?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          shipping_address?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          total_amount?: number
          currency?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          shipping_address?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      workout_exercise_logs: {
        Row: {
          id: string
          daily_log_id: string
          exercise_id: string
          sets_completed: number | null
          reps_completed: number[] | null
          weight_used: number[] | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_log_id: string
          exercise_id: string
          sets_completed?: number | null
          reps_completed?: number[] | null
          weight_used?: number[] | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_log_id?: string
          exercise_id?: string
          sets_completed?: number | null
          reps_completed?: number[] | null
          weight_used?: number[] | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_dashboard_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}

// Json helper type (mirrors Supabase generated output)
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row']
export type WorkoutDay = Database['public']['Tables']['workout_days']['Row']
export type WorkoutDayExercise = Database['public']['Tables']['workout_day_exercises']['Row']
export type DailyLog = Database['public']['Tables']['daily_logs']['Row']
export type FoodEntry = Database['public']['Tables']['food_entries']['Row']
export type WeightLog = Database['public']['Tables']['weight_logs']['Row']
export type WeeklyAnalysis = Database['public']['Tables']['weekly_analyses']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type WorkoutExerciseLog = Database['public']['Tables']['workout_exercise_logs']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert']
export type WorkoutPlanInsert = Database['public']['Tables']['workout_plans']['Insert']
export type WorkoutDayInsert = Database['public']['Tables']['workout_days']['Insert']
export type WorkoutDayExerciseInsert = Database['public']['Tables']['workout_day_exercises']['Insert']
export type DailyLogInsert = Database['public']['Tables']['daily_logs']['Insert']
export type FoodEntryInsert = Database['public']['Tables']['food_entries']['Insert']
export type WeightLogInsert = Database['public']['Tables']['weight_logs']['Insert']
export type WeeklyAnalysisInsert = Database['public']['Tables']['weekly_analyses']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type WorkoutExerciseLogInsert = Database['public']['Tables']['workout_exercise_logs']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update']
export type WorkoutPlanUpdate = Database['public']['Tables']['workout_plans']['Update']
export type WorkoutDayUpdate = Database['public']['Tables']['workout_days']['Update']
export type WorkoutDayExerciseUpdate = Database['public']['Tables']['workout_day_exercises']['Update']
export type DailyLogUpdate = Database['public']['Tables']['daily_logs']['Update']
export type FoodEntryUpdate = Database['public']['Tables']['food_entries']['Update']
export type WeightLogUpdate = Database['public']['Tables']['weight_logs']['Update']
export type WeeklyAnalysisUpdate = Database['public']['Tables']['weekly_analyses']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']
export type WorkoutExerciseLogUpdate = Database['public']['Tables']['workout_exercise_logs']['Update']
