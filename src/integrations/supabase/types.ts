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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          fb_access_token: string
          fb_pixel_enabled: boolean
          fb_pixel_id: string
          fb_test_event_code: string
          id: string
          updated_at: string
          utmify_enabled: boolean
          utmify_token: string
        }
        Insert: {
          fb_access_token?: string
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string
          fb_test_event_code?: string
          id?: string
          updated_at?: string
          utmify_enabled?: boolean
          utmify_token?: string
        }
        Update: {
          fb_access_token?: string
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string
          fb_test_event_code?: string
          id?: string
          updated_at?: string
          utmify_enabled?: boolean
          utmify_token?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          id: string
          label: string | null
          path: string
          step: string
          value: number | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          path: string
          step: string
          value?: number | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          path?: string
          step?: string
          value?: number | null
          visitor_id?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          ok: boolean
          provider: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          ok?: boolean
          provider: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ok?: boolean
          provider?: string
        }
        Relationships: []
      }
      store_leads: {
        Row: {
          amount: number
          city: string
          converted: boolean
          created_at: string
          email: string
          id: string
          items: Json
          name: string
          phone: string
          uf: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          amount?: number
          city?: string
          converted?: boolean
          created_at?: string
          email?: string
          id?: string
          items?: Json
          name?: string
          phone?: string
          uf?: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          amount?: number
          city?: string
          converted?: boolean
          created_at?: string
          email?: string
          id?: string
          items?: Json
          name?: string
          phone?: string
          uf?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          amount: number
          city: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          external_id: string
          id: string
          items: Json
          method: string
          reference_id: string
          status: string
          uf: string
          updated_at: string
        }
        Insert: {
          amount?: number
          city?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          external_id: string
          id?: string
          items?: Json
          method: string
          reference_id: string
          status: string
          uf?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          city?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          external_id?: string
          id?: string
          items?: Json
          method?: string
          reference_id?: string
          status?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
