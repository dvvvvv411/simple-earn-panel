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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bot_trades: {
        Row: {
          amount: number
          bot_id: string
          buy_price: number
          completed_at: string | null
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          leverage: number
          profit_amount: number | null
          profit_percentage: number | null
          sell_price: number | null
          started_at: string
          status: string
          trade_type: string
        }
        Insert: {
          amount: number
          bot_id: string
          buy_price: number
          completed_at?: string | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          leverage?: number
          profit_amount?: number | null
          profit_percentage?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          trade_type: string
        }
        Update: {
          amount?: number
          bot_id?: string
          buy_price?: number
          completed_at?: string | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          leverage?: number
          profit_amount?: number | null
          profit_percentage?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_trades_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "trading_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_resend_configs: {
        Row: {
          api_key: string | null
          branding_id: string
          created_at: string
          from_email: string
          from_name: string
          id: string
          reply_to: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          branding_id: string
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          reply_to?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          branding_id?: string
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          reply_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branding_resend_configs_branding_id_fkey"
            columns: ["branding_id"]
            isOneToOne: true
            referencedRelation: "brandings"
            referencedColumns: ["id"]
          },
        ]
      }
      brandings: {
        Row: {
          accent_color: string | null
          coinmarketcap_api_key: string | null
          created_at: string
          domain: string | null
          id: string
          logo_path: string | null
          name: string
          type: Database["public"]["Enums"]["branding_type"]
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          coinmarketcap_api_key?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_path?: string | null
          name: string
          type: Database["public"]["Enums"]["branding_type"]
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          coinmarketcap_api_key?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          type?: Database["public"]["Enums"]["branding_type"]
          updated_at?: string
        }
        Relationships: []
      }
      consultants: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_default: boolean | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_default?: boolean | null
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_default?: boolean | null
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      crypto_price_history: {
        Row: {
          change_24h: number | null
          created_at: string
          id: string
          price: number
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          change_24h?: number | null
          created_at?: string
          id?: string
          price: number
          symbol: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          change_24h?: number | null
          created_at?: string
          id?: string
          price?: number
          symbol?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          branding_id: string | null
          consultant_id: string | null
          created_at: string
          current_ranking_id: string | null
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          referral_code: string | null
          updated_at: string
          wallet_password_hash: string | null
        }
        Insert: {
          balance?: number
          branding_id?: string | null
          consultant_id?: string | null
          created_at?: string
          current_ranking_id?: string | null
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          wallet_password_hash?: string | null
        }
        Update: {
          balance?: number
          branding_id?: string | null
          consultant_id?: string | null
          created_at?: string
          current_ranking_id?: string | null
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          wallet_password_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branding_id_fkey"
            columns: ["branding_id"]
            isOneToOne: false
            referencedRelation: "brandings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_ranking_id_fkey"
            columns: ["current_ranking_id"]
            isOneToOne: false
            referencedRelation: "ranking_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_tiers: {
        Row: {
          border_color: string
          created_at: string
          daily_trades: number
          gradient_from: string
          gradient_to: string
          icon_name: string
          id: string
          max_balance: number
          min_balance: number
          name: string
          sort_order: number
          text_color: string
          updated_at: string
        }
        Insert: {
          border_color: string
          created_at?: string
          daily_trades?: number
          gradient_from: string
          gradient_to: string
          icon_name: string
          id?: string
          max_balance: number
          min_balance: number
          name: string
          sort_order: number
          text_color: string
          updated_at?: string
        }
        Update: {
          border_color?: string
          created_at?: string
          daily_trades?: number
          gradient_from?: string
          gradient_to?: string
          icon_name?: string
          id?: string
          max_balance?: number
          min_balance?: number
          name?: string
          sort_order?: number
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          id: string
          referral_id: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_id: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "user_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "user_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_message: boolean
          message: string
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_message?: boolean
          message: string
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_message?: boolean
          message?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          admin_user_id: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          admin_user_id?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          admin_user_id?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_bots: {
        Row: {
          buy_price: number | null
          created_at: string
          cryptocurrency: string
          current_balance: number
          expected_completion_time: string | null
          id: string
          leverage: number | null
          position_type: string | null
          sell_price: number | null
          start_amount: number
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price?: number | null
          created_at?: string
          cryptocurrency: string
          current_balance?: number
          expected_completion_time?: string | null
          id?: string
          leverage?: number | null
          position_type?: string | null
          sell_price?: number | null
          start_amount: number
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number | null
          created_at?: string
          cryptocurrency?: string
          current_balance?: number
          expected_completion_time?: string | null
          id?: string
          leverage?: number | null
          position_type?: string | null
          sell_price?: number | null
          start_amount?: number
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_tracking: {
        Row: {
          created_at: string
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          created_at: string | null
          id: string
          qualified_at: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          rewarded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          rewarded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          rewarded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          new_balance: number
          previous_balance: number
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          new_balance: number
          previous_balance: number
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          new_balance?: number
          previous_balance?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_user_ranking: {
        Args: { bot_investments?: number; user_balance: number }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_user_rankings: { Args: never; Returns: undefined }
      update_user_balance: {
        Args: {
          admin_user_id: string
          amount_change: number
          target_user_id: string
          transaction_description: string
          transaction_type: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      branding_type: "kryptotrading" | "festgeld" | "sonstiges"
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
      branding_type: ["kryptotrading", "festgeld", "sonstiges"],
    },
  },
} as const
