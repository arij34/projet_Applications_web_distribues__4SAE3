export interface Availability {
  id?: number;
  hoursPerDay: number;
  selectedDays: string[];
  selectedPeriods: string[];
  hoursPerWeek?: number;   
  status?: string;         

}