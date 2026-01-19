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
      bank_deposit_requests: {
        Row: {
          amount: number
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          reference_code: string
          status: string
          updated_at: string
          user_confirmed_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          reference_code: string
          status?: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          reference_code?: string
          status?: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_deposit_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_deposit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      credit_requests: {
        Row: {
          bank_statements_paths: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          credit_amount: number | null
          documents_submitted_at: string | null
          health_insurance: string | null
          id: string
          identcode: string | null
          partner_bank: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_slips_paths: string[] | null
          sms_code: string | null
          status: string
          tax_id: string | null
          tax_number: string | null
          updated_at: string
          user_confirmed_at: string | null
          user_id: string
          verification_link: string | null
        }
        Insert: {
          bank_statements_paths?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_amount?: number | null
          documents_submitted_at?: string | null
          health_insurance?: string | null
          id?: string
          identcode?: string | null
          partner_bank?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_slips_paths?: string[] | null
          sms_code?: string | null
          status?: string
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string
          user_confirmed_at?: string | null
          user_id: string
          verification_link?: string | null
        }
        Update: {
          bank_statements_paths?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_amount?: number | null
          documents_submitted_at?: string | null
          health_insurance?: string | null
          id?: string
          identcode?: string | null
          partner_bank?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_slips_paths?: string[] | null
          sms_code?: string | null
          status?: string
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string
          user_confirmed_at?: string | null
          user_id?: string
          verification_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_deposits: {
        Row: {
          actually_paid: number | null
          completed_at: string | null
          created_at: string
          expiration_estimate_date: string | null
          id: string
          invoice_url: string | null
          nowpayments_invoice_id: string | null
          nowpayments_payment_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string | null
          price_amount: number
          price_currency: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actually_paid?: number | null
          completed_at?: string | null
          created_at?: string
          expiration_estimate_date?: string | null
          id?: string
          invoice_url?: string | null
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          price_amount: number
          price_currency?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actually_paid?: number | null
          completed_at?: string | null
          created_at?: string
          expiration_estimate_date?: string | null
          id?: string
          invoice_url?: string | null
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          price_amount?: number
          price_currency?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      eur_deposit_requests: {
        Row: {
          bank_account_holder: string | null
          bank_bic: string | null
          bank_iban: string | null
          bank_name: string | null
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          identcode: string
          partner_bank: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sms_code: string | null
          status: string
          updated_at: string
          user_confirmed_at: string | null
          user_id: string
          verification_link: string
          verification_type: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          contact_email: string
          contact_phone: string
          created_at?: string
          id?: string
          identcode?: string
          partner_bank: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sms_code?: string | null
          status?: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id: string
          verification_link: string
          verification_type: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          identcode?: string
          partner_bank?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sms_code?: string | null
          status?: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id?: string
          verification_link?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "eur_deposit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eur_deposit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          birth_date: string
          birth_place: string
          city: string
          country: string | null
          created_at: string
          employment_status: string
          first_name: string
          id: string
          id_back_path: string
          id_front_path: string
          last_name: string
          monthly_income: string
          nationality: string
          postal_code: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_of_funds: string[]
          status: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_place: string
          city: string
          country?: string | null
          created_at?: string
          employment_status: string
          first_name: string
          id?: string
          id_back_path: string
          id_front_path: string
          last_name: string
          monthly_income: string
          nationality: string
          postal_code: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_of_funds: string[]
          status?: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_place?: string
          city?: string
          country?: string | null
          created_at?: string
          employment_status?: string
          first_name?: string
          id?: string
          id_back_path?: string
          id_front_path?: string
          last_name?: string
          monthly_income?: string
          nationality?: string
          postal_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_of_funds?: string[]
          status?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          branding_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          status: string
          status_updated_at: string | null
        }
        Insert: {
          branding_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          status?: string
          status_updated_at?: string | null
        }
        Update: {
          branding_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
          status_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_branding_id_fkey"
            columns: ["branding_id"]
            isOneToOne: false
            referencedRelation: "brandings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
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
          free_bots: number
          id: string
          kyc_required: boolean | null
          last_name: string | null
          phone: string | null
          referral_code: string | null
          unlucky_streak: boolean | null
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
          free_bots?: number
          id: string
          kyc_required?: boolean | null
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          unlucky_streak?: boolean | null
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
          free_bots?: number
          id?: string
          kyc_required?: boolean | null
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          unlucky_streak?: boolean | null
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
      streak_bot_rewards: {
        Row: {
          created_at: string | null
          granted_at: string | null
          id: string
          reward_date: string
          streak_day: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          id?: string
          reward_date: string
          streak_day: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          id?: string
          reward_date?: string
          streak_day?: number
          user_id?: string
        }
        Relationships: []
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
      task_templates: {
        Row: {
          compensation: number
          created_at: string
          description: string
          id: string
          logo_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          compensation?: number
          created_at?: string
          description: string
          id?: string
          logo_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          compensation?: number
          created_at?: string
          description?: string
          id?: string
          logo_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          bot_token: string | null
          chat_id: string | null
          created_at: string
          enabled: boolean
          id: string
          notify_bank_deposit_created: boolean | null
          notify_bank_kyc_submitted: boolean | null
          notify_credit_documents_submitted: boolean | null
          notify_credit_ident_submitted: boolean | null
          notify_deposit_created: boolean
          notify_deposit_paid: boolean
          notify_kyc_submitted: boolean | null
          notify_new_lead: boolean
          notify_new_user: boolean
          notify_support_ticket: boolean
          notify_task_approved: boolean | null
          notify_task_assigned: boolean | null
          notify_task_enrolled: boolean | null
          notify_task_rejected: boolean | null
          notify_task_started: boolean | null
          notify_task_submitted: boolean | null
          notify_withdrawal: boolean
          updated_at: string
        }
        Insert: {
          bot_token?: string | null
          chat_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          notify_bank_deposit_created?: boolean | null
          notify_bank_kyc_submitted?: boolean | null
          notify_credit_documents_submitted?: boolean | null
          notify_credit_ident_submitted?: boolean | null
          notify_deposit_created?: boolean
          notify_deposit_paid?: boolean
          notify_kyc_submitted?: boolean | null
          notify_new_lead?: boolean
          notify_new_user?: boolean
          notify_support_ticket?: boolean
          notify_task_approved?: boolean | null
          notify_task_assigned?: boolean | null
          notify_task_enrolled?: boolean | null
          notify_task_rejected?: boolean | null
          notify_task_started?: boolean | null
          notify_task_submitted?: boolean | null
          notify_withdrawal?: boolean
          updated_at?: string
        }
        Update: {
          bot_token?: string | null
          chat_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          notify_bank_deposit_created?: boolean | null
          notify_bank_kyc_submitted?: boolean | null
          notify_credit_documents_submitted?: boolean | null
          notify_credit_ident_submitted?: boolean | null
          notify_deposit_created?: boolean
          notify_deposit_paid?: boolean
          notify_kyc_submitted?: boolean | null
          notify_new_lead?: boolean
          notify_new_user?: boolean
          notify_support_ticket?: boolean
          notify_task_approved?: boolean | null
          notify_task_assigned?: boolean | null
          notify_task_enrolled?: boolean | null
          notify_task_rejected?: boolean | null
          notify_task_started?: boolean | null
          notify_task_submitted?: boolean | null
          notify_withdrawal?: boolean
          updated_at?: string
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
      user_activity_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          last_active_at: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string
          started_at?: string
          user_agent?: string | null
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
      user_notes: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_task_enrollments: {
        Row: {
          created_at: string
          deactivated_at: string | null
          enrolled_at: string
          enrolled_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_task_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          ident_code: string | null
          ident_link: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          started_at: string | null
          status: string
          submitted_at: string | null
          task_password: string | null
          template_id: string
          updated_at: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          ident_code?: string | null
          ident_link?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          task_password?: string | null
          template_id: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          ident_code?: string | null
          ident_link?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          task_password?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          btc_wallet_address: string
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          btc_wallet_address: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          btc_wallet_address?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
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
      create_admin_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_trading_bot_atomic: {
        Args: {
          p_cryptocurrency: string
          p_expected_completion_time: string
          p_start_amount: number
          p_symbol: string
        }
        Returns: string
      }
      credit_balance_from_bot: {
        Args: { amount: number; description: string; target_user_id: string }
        Returns: boolean
      }
      deduct_balance_for_bot: {
        Args: { amount: number; description: string }
        Returns: boolean
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
      mark_all_notifications_read: { Args: never; Returns: number }
      process_bank_deposit: {
        Args: { p_admin_id: string; p_request_id: string }
        Returns: boolean
      }
      process_withdrawal_request: {
        Args: {
          admin_note_text?: string
          new_status: string
          request_id: string
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
      update_user_free_bots: {
        Args: {
          amount_change: number
          operation_type: string
          target_user_id: string
        }
        Returns: boolean
      }
      use_free_bot: { Args: { p_user_id: string }; Returns: boolean }
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
