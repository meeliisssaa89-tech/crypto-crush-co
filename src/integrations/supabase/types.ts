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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_type: string
          cooldown_seconds: number
          created_at: string
          id: string
          is_active: boolean
          reward_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          ad_type?: string
          cooldown_seconds?: number
          created_at?: string
          id?: string
          is_active?: boolean
          reward_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          cooldown_seconds?: number
          created_at?: string
          id?: string
          is_active?: boolean
          reward_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      airdrops: {
        Row: {
          created_at: string
          id: string
          last_claim_at: string | null
          tokens_claimed: number
          tokens_earned: number
          tokens_locked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_claim_at?: string | null
          tokens_claimed?: number
          tokens_earned?: number
          tokens_locked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_claim_at?: string | null
          tokens_claimed?: number
          tokens_earned?: number
          tokens_locked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      box_prizes: {
        Row: {
          animation_url: string | null
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          rarity: string
          sound_url: string | null
          value: number
          weight: number
        }
        Insert: {
          animation_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label: string
          rarity?: string
          sound_url?: string | null
          value?: number
          weight?: number
        }
        Update: {
          animation_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          rarity?: string
          sound_url?: string | null
          value?: number
          weight?: number
        }
        Relationships: []
      }
      currencies: {
        Row: {
          created_at: string
          exchange_rate: number
          id: string
          is_active: boolean
          name: string
          symbol: string
          total_supply: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exchange_rate?: number
          id?: string
          is_active?: boolean
          name: string
          symbol: string
          total_supply?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exchange_rate?: number
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string
          total_supply?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          last_streak_date: string | null
          level: number
          referral_code: string | null
          referred_by: string | null
          streak_days: number
          telegram_id: number | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_streak_date?: string | null
          level?: number
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          telegram_id?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_streak_date?: string | null
          level?: number
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          telegram_id?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          referred_id: string
          referrer_id: string
          reward_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          referred_id: string
          referrer_id: string
          reward_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
        }
        Relationships: []
      }
      shortlinks: {
        Row: {
          created_at: string
          daily_limit: number | null
          id: string
          is_active: boolean
          network: string
          reward_amount: number
          timer_seconds: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          network?: string
          reward_amount?: number
          timer_seconds?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          network?: string
          reward_amount?: number
          timer_seconds?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      spin_prizes: {
        Row: {
          animation_url: string | null
          color: string
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          sort_order: number
          sound_url: string | null
          value: number
          weight: number
        }
        Insert: {
          animation_url?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label: string
          sort_order?: number
          sound_url?: string | null
          value?: number
          weight?: number
        }
        Update: {
          animation_url?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          sort_order?: number
          sound_url?: string | null
          value?: number
          weight?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          current_completions: number
          description: string | null
          id: string
          is_daily: boolean
          is_limited: boolean
          max_completions: number | null
          reward_amount: number
          reward_currency_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          url: string | null
          verification_type: string
        }
        Insert: {
          created_at?: string
          current_completions?: number
          description?: string | null
          id?: string
          is_daily?: boolean
          is_limited?: boolean
          max_completions?: number | null
          reward_amount?: number
          reward_currency_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          verification_type?: string
        }
        Update: {
          created_at?: string
          current_completions?: number
          description?: string | null
          id?: string
          is_daily?: boolean
          is_limited?: boolean
          max_completions?: number | null
          reward_amount?: number
          reward_currency_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_reward_currency_id_fkey"
            columns: ["reward_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency_id: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ad_views: {
        Row: {
          ad_id: string
          id: string
          reward_amount: number
          user_id: string
          viewed_at: string
        }
        Insert: {
          ad_id: string
          id?: string
          reward_amount?: number
          user_id: string
          viewed_at?: string
        }
        Update: {
          ad_id?: string
          id?: string
          reward_amount?: number
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balances: {
        Row: {
          balance: number
          currency_id: string
          id: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency_id: string
          id?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_balances_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_box_opens: {
        Row: {
          id: string
          opened_at: string
          prize_id: string | null
          reward_amount: number
          unlock_method: string
          user_id: string
        }
        Insert: {
          id?: string
          opened_at?: string
          prize_id?: string | null
          reward_amount?: number
          unlock_method?: string
          user_id: string
        }
        Update: {
          id?: string
          opened_at?: string
          prize_id?: string | null
          reward_amount?: number
          unlock_method?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_box_opens_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "box_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_shortlinks: {
        Row: {
          completed_at: string
          id: string
          reward_amount: number
          shortlink_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          reward_amount?: number
          shortlink_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          reward_amount?: number
          shortlink_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shortlinks_shortlink_id_fkey"
            columns: ["shortlink_id"]
            isOneToOne: false
            referencedRelation: "shortlinks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spins: {
        Row: {
          id: string
          prize_id: string | null
          reward_amount: number
          spun_at: string
          user_id: string
        }
        Insert: {
          id?: string
          prize_id?: string | null
          reward_amount?: number
          spun_at?: string
          user_id: string
        }
        Update: {
          id?: string
          prize_id?: string | null
          reward_amount?: number
          spun_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spins_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "spin_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          status: string
          task_id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency_id: string | null
          fee_amount: number
          id: string
          method: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency_id?: string | null
          fee_amount?: number
          id?: string
          method: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency_id?: string | null
          fee_amount?: number
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
