export interface ApplicationQuestion {
  id: number;
  orderIndex: number;
  label: string;
  required: boolean;
  type: string; // 'TEXT', 'TEXTAREA', 'NUMBER', ...
}