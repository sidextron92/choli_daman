export type DesignType = "REGULAR_DESIGN" | "OPEN_DESIGN";

export interface ClothType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignClothType {
  cloth_type_id: string;
  cloth_type_name: string;
  sell_price: number;
}

export interface Design {
  id: string;
  image_url: string;
  cost: number;
  karigar_id: string | null;
  sequence_number: number;
  category: string;
  design_type: DesignType;
  created_at: string;
  updated_at: string;
  karigar_name: string | null;
  karigar_mobile: string | null;
  cloth_types: DesignClothType[];
}

export interface Karigar {
  id: string;
  name: string;
  mobile_number: string;
  created_at: string;
  updated_at: string;
}

export interface KarigarWithDesigns extends Karigar {
  assigned_designs: Design[];
}

export interface DesignFilters {
  q?: string;
  category?: string;
  clothType?: string;
  karigarId?: string;
  sort?: "newest" | "oldest" | "cost-high" | "cost-low";
  page?: number;
}

export interface PaginatedDesigns {
  designs: Design[];
  page: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalDesigns: number;
  totalKarigars: number;
  assignedDesigns: number;
  unassignedDesigns: number;
}

export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const INITIAL_ACTION_STATE: ActionState = {
  status: "idle",
  message: "",
};
