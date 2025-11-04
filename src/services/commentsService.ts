import { http } from "@/lib/http";

type CreateCommentParams = {
  quoteRevisionGroupId: string;
  version: number;
  itemRevisionGroupId?: string | null;
  type: "GENERAL" | "ITEM";
  content: string;
};
export const createComment = async ({
  content,
  quoteRevisionGroupId,
  version,
  type,
  itemRevisionGroupId = null,
}: CreateCommentParams) => {
  const url = `/quote/revision-comments`;
  try {
    const response = await http.post(url, {
      quote_revision_group_id: quoteRevisionGroupId,
      version,
      item_revision_group_id: itemRevisionGroupId,
      type,
      content,
      platform: "dealer",
    });
    return "success";
  } catch (error) {
    console.error("Error getting quote options:", error);
    return (error as Error).message;
  }
};

export const getGeneralComments = async (quoteRevisionGroupId: string) => {
  const url = `/quote/revision-comments/general/${quoteRevisionGroupId}`;
  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};

export const getAllItemComments = async (itemRevisionGroupId: string) => {
  const url = `/quote/revision-comments/item/${itemRevisionGroupId}/comments/all`;
  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};

export const markCommentAsRead = async (commentId: string) => {
  const url = `/quote/revision-comments/${commentId}/mark-read`;
  try {
    await http.post(url);
    return "success";
  } catch (error) {
    console.error("Error marking comment as read:", error);
    return "error";
  }
};

export const getGeneralUnreadCommmentAmount = async (
  quoteRevisionGroupId: string
) => {
  const response = await getGeneralComments(quoteRevisionGroupId);

  const comments = (response ?? []) as any[];
  return comments.filter(
    (comment: any) => !comment.is_read && comment.platform === "internal"
  ).length;
};

export const getUnreadComments = async (
  quoteRevisionGroupId: string,
  version?: number
): Promise<any | undefined> => {
  const url = `/quote/revision-comments/item/${quoteRevisionGroupId}/comments/unread${
    version !== undefined ? `?version=${version}` : ""
  }`;
  try {
    const response = await http.get<any>(url);
    return response;
  } catch (error) {
    console.error("Error getting unread item count:", error);
  }
};

export const getAllItemsCommentsCount = async (
  quoteRevisionGroupId: string,
  version?: number
) => {
  const url = `/quote/revision-comments/${quoteRevisionGroupId}/comments/count${
    version !== undefined ? `?version=${version}` : ""
  }`;

  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};

export const getDealerItemCommentsCount = async (
  quoteRevisionGroupId: string,
  version?: number
) => {
  try {
    const response = (await getAllItemsCommentsCount(
      quoteRevisionGroupId,
      version
    )) as any;
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};

export const getItemCommentsByVersion = async (
  itemRevisionGroupId: string,
  version?: number
) => {
  const url = `/quote/revision-comments/item/${itemRevisionGroupId}/comments${
    version !== undefined ? `?version=${version}` : ""
  }`;

  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};
