/* eslint-disable @typescript-eslint/no-explicit-any */
export type AvailabilitySlot = {
  start: string;
  end: string;
  duration_hours?: number;
};

export type PriorityLevel = "Low" | "Medium" | "High";
export type DialogMode = "create" | "edit";

export interface InspectorAvailability {
  user_id: string;
  user_name: string;
  email: string;
  date: string;
  availability: {
    occupied_slots: Array<{ start: string; end: string }>;
    free_slots: Array<{ start: string; end: string; duration_hours?: number }>;
    is_completely_free: boolean;
    total_occupied_hours: number;
  };
}

export interface InspectionDialogProps {
  open: boolean;
  onClose: () => void;
  data: any; // Can be inquiry (for create) or todo (for edit)
  mode: DialogMode;
}

export interface InspectorDetails {
  name: string;
  email: string;
  full_name: string;
}