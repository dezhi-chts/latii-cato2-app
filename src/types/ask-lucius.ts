type Role = "user" | "assistant";
export type Feedback = "good" | "bad";

export type Message = {
  role: Role;
  content: string;
  creator: string;
  response_feedback?: Feedback | undefined;
};
