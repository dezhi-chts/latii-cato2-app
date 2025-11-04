export type UserDataForUpdate = {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  password?: string;
};

export type passwordChangeData = {
  current_password: string;
  new_password: string;
};
