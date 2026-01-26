export type UserDataForUpdate = {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  new_password?: string;
  current_password?: string;
};

export type passwordChangeData = {
  current_password: string;
  new_password: string;
};

export type Contact = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  job_title: string;
  id?: number;
  company_id?: number;
  note?: string;
  password?: string;
};
