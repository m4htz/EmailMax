export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      email_accounts: {
        Row: {
          id: string
          created_at: string
          email: string
          password: string
          smtp_host: string
          smtp_port: number
          imap_host: string
          imap_port: number
          status: 'connected' | 'warming_up' | 'error'
          user_id: string
          last_checked: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          password: string
          smtp_host: string
          smtp_port: number
          imap_host: string
          imap_port: number
          status?: 'connected' | 'warming_up' | 'error'
          user_id: string
          last_checked?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          password?: string
          smtp_host?: string
          smtp_port?: number
          imap_host?: string
          imap_port?: number
          status?: 'connected' | 'warming_up' | 'error'
          user_id?: string
          last_checked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      warmup_plans: {
        Row: {
          id: string
          created_at: string
          account_id: string
          daily_volume: number
          reply_percentage: number
          active: boolean
          start_date: string
          end_date: string | null
          status: 'active' | 'paused' | 'completed'
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          account_id: string
          daily_volume: number
          reply_percentage: number
          active?: boolean
          start_date?: string
          end_date?: string | null
          status?: 'active' | 'paused' | 'completed'
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          account_id?: string
          daily_volume?: number
          reply_percentage?: number
          active?: boolean
          start_date?: string
          end_date?: string | null
          status?: 'active' | 'paused' | 'completed'
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warmup_plans_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warmup_plans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      warmup_metrics: {
        Row: {
          id: string
          created_at: string
          plan_id: string
          emails_sent: number
          emails_delivered: number
          emails_opened: number
          emails_replied: number
          date: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          plan_id: string
          emails_sent: number
          emails_delivered: number
          emails_opened: number
          emails_replied: number
          date?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          plan_id?: string
          emails_sent?: number
          emails_delivered?: number
          emails_opened?: number
          emails_replied?: number
          date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warmup_metrics_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "warmup_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warmup_metrics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
  }
} 