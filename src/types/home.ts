export type ProjectStatus = "Take Off" | "Uploaded";

export type ProjectRow = {
  key: string;
  projectName: string;
  lastEdit: string;
  budgetPrice: number;
  endCustomer: string;
  status: ProjectStatus;
  notes: string;
  isFavorite: boolean;
};
