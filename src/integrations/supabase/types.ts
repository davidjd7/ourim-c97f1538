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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      asset_tags: {
        Row: {
          asset_id: string
          asset_type: string
          created_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          asset_type?: string
          created_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          asset_id?: string
          asset_type?: string
          created_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_characteristics: {
        Row: {
          amortissement_annuel: number | null
          asset_id: string
          asset_type: string
          created_at: string
          duree_mois: number | null
          id: string
          indice_base: string | null
          marge: number | null
          montant_initial: number | null
          taux: number | null
          type: string | null
          type_credit: string | null
          type_taux: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amortissement_annuel?: number | null
          asset_id: string
          asset_type?: string
          created_at?: string
          duree_mois?: number | null
          id?: string
          indice_base?: string | null
          marge?: number | null
          montant_initial?: number | null
          taux?: number | null
          type?: string | null
          type_credit?: string | null
          type_taux?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amortissement_annuel?: number | null
          asset_id?: string
          asset_type?: string
          created_at?: string
          duree_mois?: number | null
          id?: string
          indice_base?: string | null
          marge?: number | null
          montant_initial?: number | null
          taux?: number | null
          type?: string | null
          type_credit?: string | null
          type_taux?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_flows: {
        Row: {
          capital_debut: number | null
          created_at: string
          date: string
          debt_characteristics_id: string
          id: string
          rmbt_capital: number | null
          rmbt_interet: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capital_debut?: number | null
          created_at?: string
          date: string
          debt_characteristics_id: string
          id?: string
          rmbt_capital?: number | null
          rmbt_interet?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capital_debut?: number | null
          created_at?: string
          date?: string
          debt_characteristics_id?: string
          id?: string
          rmbt_capital?: number | null
          rmbt_interet?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_flows_debt_characteristics_id_fkey"
            columns: ["debt_characteristics_id"]
            isOneToOne: false
            referencedRelation: "debt_characteristics"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          id: string
          immobilier_id: string
          mime_type: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size: number
          id?: string
          immobilier_id: string
          mime_type?: string | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          id?: string
          immobilier_id?: string
          mime_type?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      immobilier_cashflows: {
        Row: {
          created_at: string
          date: string
          id: string
          immobilier_id: string
          loyer: number | null
          retrait_amort: number | null
          retrait_autres: number | null
          rex: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          immobilier_id: string
          loyer?: number | null
          retrait_amort?: number | null
          retrait_autres?: number | null
          rex?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          immobilier_id?: string
          loyer?: number | null
          retrait_amort?: number | null
          retrait_autres?: number | null
          rex?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      immobilier_history: {
        Row: {
          action_type: string
          created_at: string
          field_name: string
          id: string
          immobilier_id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          field_name: string
          id?: string
          immobilier_id: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          field_name?: string
          id?: string
          immobilier_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      immobilier_immobilisations: {
        Row: {
          created_at: string
          date: string
          id: string
          immobilier_id: string
          montant: number | null
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          immobilier_id: string
          montant?: number | null
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          immobilier_id?: string
          montant?: number | null
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      immobilier_investments: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          investment_amount: number | null
          investment_date: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          investment_amount?: number | null
          investment_date?: string | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          investment_amount?: number | null
          investment_date?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "immobilier_investments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      immobilier_valorisations: {
        Row: {
          created_at: string
          date: string
          id: string
          immobilier_id: string
          note: string | null
          updated_at: string
          user_id: string
          valeur: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          immobilier_id: string
          note?: string | null
          updated_at?: string
          user_id: string
          valeur?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          immobilier_id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          valeur?: number | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          immobilier_id: string
          is_private: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          immobilier_id: string
          is_private?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          immobilier_id?: string
          is_private?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
