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
      profiles: {
        Row: {
          balance: number
          branding_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          branding_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          branding_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branding_id_fkey"
            columns: ["branding_id"]
            isOneToOne: false
            referencedRelation: "brandings"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_bots: {
        Row: {
          created_at: string
          cryptocurrency: string
          current_balance: number
          id: string
          start_amount: number
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cryptocurrency: string
          current_balance?: number
          id?: string
          start_amount: number
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cryptocurrency?: string
          current_balance?: number
          id?: string
          start_amount?: number
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
