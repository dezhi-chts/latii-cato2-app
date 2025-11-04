import { http } from "@/lib/http";

interface StreamMessageParams {
  chat_id: number;
  creator: string;
  content: string;
  current_item_id?: string | null;
}

export async function streamAssistantMessage(
  params: StreamMessageParams,
  onMessageChunk: (chunk: string) => void,
  onFunctionCallDone: () => void
) {
  const apiUrl = process.env.NEXT_PUBLIC_PROJECTS_API || "";
  const userData = localStorage.getItem("userData");
  let authorization:any = null
  if (userData) {
    const parsedData = JSON.parse(userData);
    const token = parsedData.access_token;
    authorization = `Bearer ${token}`;
  }
  let headers:any = {
    "Content-Type": "application/json",
  }
  if (authorization){
    headers["Authorization"] = authorization
  }
  const response = await fetch(`${apiUrl}/assistant/chat/send`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(params),
  });

  if (!response.ok || !response.body) {
    throw new Error("Error sending message to assistant");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let partial = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    partial += decoder.decode(value, { stream: true });

    const lines = partial.split("\n\n");
    partial = lines.pop() || "";

    for (const line of lines) {
      const [eventLine, dataLine] = line.split("\n");
      const event = eventLine?.replace("event: ", "").trim();
      const data = dataLine?.replace("data: ", "").trim();

      if (!event || !data) continue;

      const parsed = JSON.parse(data);

      if (event === "messageDelta") {
        onMessageChunk(parsed.content);
      }
      if (event === "functionCallDone") {
        if (parsed?.is_quote_changed) {
          onFunctionCallDone();
        }
      }
    }
  }
}

export const getChatByQuoteId = async (quoteId: string | number) => {
  try {
    const response = await http.get(
      `/assistant/get-chat-by-quote-id/${quoteId}`
    );
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }
};

export const getChatMessages = async (chatId: number) => {
  try {
    const response = await http.get(`/assistant/chat/${chatId}/message`);
    return response;
  } catch (error) {
    console.error("Error getting chat messages:", error);
  }
};

interface CreateChatParams {
  quote_id: string;
  project_id: number;
  creator?: string | null;
}

export const createChatForQuote = async (params: CreateChatParams) => {
  try {
    const response = await http.post("/assistant/chat", {
      quote_id: params.quote_id,
      project_id: params.project_id,
      creator: params.creator,
    });
    return response;
  } catch (error) {
    console.error("Error creating chat for quote:", error);
    throw error;
  }
};
