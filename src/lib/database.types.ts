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
      offers: {
        Row: {
          id: string
          user_id: string
          name: string
          library_link: string
          landing_page_link: string
          checkout_link: string
          niche: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          library_link: string
          landing_page_link: string
          checkout_link: string
          niche: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          library_link?: string
          landing_page_link?: string
          checkout_link?: string
          niche?: string
          created_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          user_id: string
          offer_id: string | null
          start_date: string
          product_name: string
          niche: string
          offer_source: string
          landing_page_url: string
          invested_amount: number
          clicks: number
          return_value: number
          cpa: number
          roi: number
          roas: number
          status: 'Escalar' | 'Pausar' | 'Encerrar'
          observations: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          offer_id?: string | null
          start_date: string
          product_name: string
          niche: string
          offer_source: string
          landing_page_url: string
          invested_amount: number
          clicks: number
          return_value: number
          cpa: number
          roi: number
          roas: number
          status: 'Escalar' | 'Pausar' | 'Encerrar'
          observations?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string | null
          start_date?: string
          product_name?: string
          niche?: string
          offer_source?: string
          landing_page_url?: string
          invested_amount?: number
          clicks?: number
          return_value?: number
          cpa?: number
          roi?: number
          roas?: number
          status?: 'Escalar' | 'Pausar' | 'Encerrar'
          observations?: string
          created_at?: string
        }
      }
      financial_data: {
        Row: {
          id: string
          user_id: string
          initial_capital: number
          current_balance: number
          total_investment: number
          total_revenue: number
          net_profit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          initial_capital?: number
          current_balance?: number
          total_investment?: number
          total_revenue?: number
          net_profit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          initial_capital?: number
          current_balance?: number
          total_investment?: number
          total_revenue?: number
          net_profit?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          test_id: string | null
          type: 'investment' | 'revenue' | 'expense'
          amount: number
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_id?: string | null
          type: 'investment' | 'revenue' | 'expense'
          amount: number
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_id?: string | null
          type?: 'investment' | 'revenue' | 'expense'
          amount?: number
          description?: string
          date?: string
          created_at?: string
        }
      }
    }
  }
}