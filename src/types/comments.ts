export type CommentsPanelProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quoteRevisionGroupId: string;
  version: number;
  items: any[];
  refetchUnreadComments?: () => void;
  itemsUnreadCount: any;
  dealerItemComments: any[];
  refreshDealerItemComments: () => void;
  isMaskOn: boolean;
};

export type ItemComment = {
  id: number;
  quote_revision_group_id: string;
  version: number;
  item_revision_group_id: string;
  type: string;
  content: string;
  platform: string;
  create_time: string;
  create_user: string;
  update_time: string | null;
  update_user: string | null;
  is_read: boolean;
  first_name?: string;
  last_name?: string;
};

export type GetUnreadCommentsResponse = {
  dealer_general_count: number;
  internal_general_count: number;
  items: [
    {
      dealer_count: number;
      internal_count: number;
      item_revision_group_id: string;
    }
  ];
};
