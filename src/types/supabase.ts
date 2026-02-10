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
      checked_items: {
        Row: {
          checked_by: string | null
          id: string
          item_id: string
          meal_plan_id: string
        }
        Insert: {
          checked_by?: string | null
          id?: string
          item_id: string
          meal_plan_id: string
        }
        Update: {
          checked_by?: string | null
          id?: string
          item_id?: string
          meal_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checked_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_shopping_items: {
        Row: {
          category: Database["public"]["Enums"]["ingredient_category"]
          id: string
          ingredient: string
          meal_plan_id: string
          quantity: number
          unit: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          id: string
          ingredient: string
          meal_plan_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          id?: string
          ingredient?: string
          meal_plan_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_shopping_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          share_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          preferences?: Json
          share_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          share_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          day_index: number
          id: string
          meal_plan_id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          recipe_id: string
          servings: number
        }
        Insert: {
          day_index: number
          id: string
          meal_plan_id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          recipe_id: string
          servings?: number
        }
        Update: {
          day_index?: number
          id?: string
          meal_plan_id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          recipe_id?: string
          servings?: number
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time: number
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          estimated_cost: Database["public"]["Enums"]["budget_level"]
          id: string
          ingredients: Json
          instructions: string[]
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          prep_time: number
          servings: number
          source_name: string | null
          source_url: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cook_time: number
          created_at?: string
          description?: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          estimated_cost: Database["public"]["Enums"]["budget_level"]
          id: string
          ingredients: Json
          instructions: string[]
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          prep_time: number
          servings: number
          source_name?: string | null
          source_url?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cook_time?: number
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          estimated_cost?: Database["public"]["Enums"]["budget_level"]
          id?: string
          ingredients?: Json
          instructions?: string[]
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          prep_time?: number
          servings?: number
          source_name?: string | null
          source_url?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_plan_access: { Args: { plan_uuid: string }; Returns: boolean }
    }
    Enums: {
      budget_level: "low" | "medium" | "high"
      difficulty: "easy" | "medium" | "hard"
      ingredient_category:
        | "produce"
        | "dairy"
        | "meat"
        | "pantry"
        | "frozen"
        | "uncategorized"
      meal_type: "breakfast" | "lunch" | "dinner"
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
      budget_level: ["low", "medium", "high"],
      difficulty: ["easy", "medium", "hard"],
      ingredient_category: [
        "produce",
        "dairy",
        "meat",
        "pantry",
        "frozen",
        "uncategorized",
      ],
      meal_type: ["breakfast", "lunch", "dinner"],
    },
  },
} as const
