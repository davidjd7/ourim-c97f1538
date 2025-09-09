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
      documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          id: string
          investment_id: string
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
          investment_id: string
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
          investment_id?: string
          mime_type?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_cashflows: {
        Row: {
          created_at: string
          date: string
          id: string
          investment_id: string
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
          investment_id: string
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
          investment_id?: string
          retrait_amort?: number | null
          retrait_autres?: number | null
          rex?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_debt_characteristics: {
        Row: {
          amortissement_annuel: number | null
          created_at: string
          duree_mois: number | null
          id: string
          investment_id: string
          montant_initial: number | null
          taux: number | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amortissement_annuel?: number | null
          created_at?: string
          duree_mois?: number | null
          id?: string
          investment_id: string
          montant_initial?: number | null
          taux?: number | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amortissement_annuel?: number | null
          created_at?: string
          duree_mois?: number | null
          id?: string
          investment_id?: string
          montant_initial?: number | null
          taux?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_debt_flows: {
        Row: {
          capital_debut: number | null
          created_at: string
          date: string
          id: string
          investment_id: string
          rmbt_capital: number | null
          rmbt_interet: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capital_debut?: number | null
          created_at?: string
          date: string
          id?: string
          investment_id: string
          rmbt_capital?: number | null
          rmbt_interet?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capital_debut?: number | null
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          rmbt_capital?: number | null
          rmbt_interet?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_history: {
        Row: {
          action_type: string
          created_at: string
          field_name: string
          id: string
          investment_id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          field_name: string
          id?: string
          investment_id: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          field_name?: string
          id?: string
          investment_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investment_immobilisations: {
        Row: {
          created_at: string
          date: string
          id: string
          investment_id: string
          montant: number | null
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          investment_id: string
          montant?: number | null
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          montant?: number | null
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_performance: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          initial_value: number | null
          investment_id: string
          return_percentage: number | null
          total_return: number | null
          tri: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          initial_value?: number | null
          investment_id: string
          return_percentage?: number | null
          total_return?: number | null
          tri?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          initial_value?: number | null
          investment_id?: string
          return_percentage?: number | null
          total_return?: number | null
          tri?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_valorisations: {
        Row: {
          created_at: string
          date: string
          id: string
          investment_id: string
          note: string | null
          updated_at: string
          user_id: string
          valeur: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          investment_id: string
          note?: string | null
          updated_at?: string
          user_id: string
          valeur?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          valeur?: number | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          address: string | null
          agent: number | null
          bail_activite: string | null
          bail_anciennete: number | null
          bail_cnr: number | null
          bail_fin_bail: string | null
          bail_gmap_link: string | null
          bail_gmap_note: string | null
          bail_loyer_ht: number | null
          bail_next_break: string | null
          bail_prise_effet: string | null
          company: string | null
          company_id: string | null
          created_at: string
          date_acquisition: string | null
          date_entree: string | null
          description: string | null
          duree_bail: number | null
          hono_notaire: number | null
          id: string
          investment_amount: number | null
          investment_date: string | null
          last_value: number | null
          locataire: string | null
          name: string
          net_vendeur: number | null
          notary_fees: number | null
          notes: string | null
          price: number | null
          status: string
          surface: number | null
          tri: number | null
          type: string
          type_bail: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          agent?: number | null
          bail_activite?: string | null
          bail_anciennete?: number | null
          bail_cnr?: number | null
          bail_fin_bail?: string | null
          bail_gmap_link?: string | null
          bail_gmap_note?: string | null
          bail_loyer_ht?: number | null
          bail_next_break?: string | null
          bail_prise_effet?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          date_entree?: string | null
          description?: string | null
          duree_bail?: number | null
          hono_notaire?: number | null
          id?: string
          investment_amount?: number | null
          investment_date?: string | null
          last_value?: number | null
          locataire?: string | null
          name: string
          net_vendeur?: number | null
          notary_fees?: number | null
          notes?: string | null
          price?: number | null
          status: string
          surface?: number | null
          tri?: number | null
          type: string
          type_bail?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          agent?: number | null
          bail_activite?: string | null
          bail_anciennete?: number | null
          bail_cnr?: number | null
          bail_fin_bail?: string | null
          bail_gmap_link?: string | null
          bail_gmap_note?: string | null
          bail_loyer_ht?: number | null
          bail_next_break?: string | null
          bail_prise_effet?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          date_entree?: string | null
          description?: string | null
          duree_bail?: number | null
          hono_notaire?: number | null
          id?: string
          investment_amount?: number | null
          investment_date?: string | null
          last_value?: number | null
          locataire?: string | null
          name?: string
          net_vendeur?: number | null
          notary_fees?: number | null
          notes?: string | null
          price?: number | null
          status?: string
          surface?: number | null
          tri?: number | null
          type?: string
          type_bail?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          investment_id: string
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
          investment_id: string
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
          investment_id?: string
          is_private?: boolean
          title?: string
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
