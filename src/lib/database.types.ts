export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string | null
          email?: string | null
          avatar_url?: string | null
        }
      }
      book_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          cover_photo: string | null
          status: 'draft' | 'completed' | 'ordered'
          paper_finish: 'matte' | 'glossy' | 'layflat'
          style: 'classic' | 'baby' | 'yearbook' | 'wedding' | 'travel' | 'minimal'
          gift_note: string | null
          share_link: string | null
          ai_prompt: string | null
          created_at: string
          updated_at: string
          ordered_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          cover_photo?: string | null
          status?: 'draft' | 'completed' | 'ordered'
          paper_finish?: 'matte' | 'glossy' | 'layflat'
          style?: 'classic' | 'baby' | 'yearbook' | 'wedding' | 'travel' | 'minimal'
          gift_note?: string | null
          share_link?: string | null
          ai_prompt?: string | null
        }
        Update: {
          title?: string
          cover_photo?: string | null
          status?: 'draft' | 'completed' | 'ordered'
          paper_finish?: 'matte' | 'glossy' | 'layflat'
          style?: 'classic' | 'baby' | 'yearbook' | 'wedding' | 'travel' | 'minimal'
          gift_note?: string | null
          share_link?: string | null
          ai_prompt?: string | null
          updated_at?: string
          ordered_at?: string | null
        }
      }
      book_pages: {
        Row: {
          id: string
          project_id: string
          layout: '1-up' | '2-up' | '3-up'
          caption: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          layout?: '1-up' | '2-up' | '3-up'
          caption?: string | null
          position?: number
        }
        Update: {
          layout?: '1-up' | '2-up' | '3-up'
          caption?: string | null
          position?: number
        }
      }
      book_photos: {
        Row: {
          id: string
          page_id: string
          project_id: string
          url: string
          storage_path: string | null
          is_low_res: boolean
          is_duplicate: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          project_id: string
          url: string
          storage_path?: string | null
          is_low_res?: boolean
          is_duplicate?: boolean
          position?: number
        }
        Update: {
          url?: string
          storage_path?: string | null
          is_low_res?: boolean
          is_duplicate?: boolean
          position?: number
        }
      }
      collaborators: {
        Row: {
          id: string
          project_id: string
          name: string
          email: string
          photos_added: number
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          email: string
          photos_added?: number
        }
        Update: {
          photos_added?: number
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          book_id: string
          book_title: string
          page_count: number
          price_per_page: number
          delivery_fee: number
          total: number
          status: 'processing' | 'printed' | 'shipped' | 'delivered'
          tracking_number: string | null
          estimated_delivery: string | null
          ordered_at: string
          prodigi_order_id: string | null
          pdf_url: string | null
          shipping_name: string | null
          shipping_address: Record<string, string> | null
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          book_title: string
          page_count: number
          price_per_page: number
          delivery_fee: number
          total: number
          status?: 'processing' | 'printed' | 'shipped' | 'delivered'
          tracking_number?: string | null
          estimated_delivery?: string | null
          prodigi_order_id?: string | null
          pdf_url?: string | null
          shipping_name?: string | null
          shipping_address?: Record<string, string> | null
        }
        Update: {
          status?: 'processing' | 'printed' | 'shipped' | 'delivered'
          tracking_number?: string | null
          estimated_delivery?: string | null
          prodigi_order_id?: string | null
          pdf_url?: string | null
        }
      }
    }
  }
}
