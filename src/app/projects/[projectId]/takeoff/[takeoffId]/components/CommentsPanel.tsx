import { useUser } from "@/context/UserContext";
import { formatDateEnglish } from "@/lib/functions";
import {
  createComment,
  getGeneralComments,
  getItemCommentsByVersion,
  markCommentAsRead,
} from "@/services/commentsService";
import { CommentsPanelProps, ItemComment } from "@/types/comments";
import { ConfigProvider, Divider, Input, notification, Tabs } from "antd";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const CommentsPanel = ({
  isOpen,
  setIsOpen,
  quoteRevisionGroupId,
  version,
  items,
  refetchUnreadComments,
  itemsUnreadCount,
  dealerItemComments,
  refreshDealerItemComments,
  isMaskOn,
}: CommentsPanelProps) => {
  const { company } = useUser();
  const dealerLogo = company?.photo_url || "/assets/logos/guest-logo.svg";

  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const [generalComments, setGeneralComments] = useState<any>();
  const [itemComments, setItemComments] = useState<
    Record<number, ItemComment[]>
  >({});
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const fetchGeneralComments = async () => {
    const response = await getGeneralComments(quoteRevisionGroupId);
    setGeneralComments(response);
  };

  const tabItems = [
    {
      key: "general",
      label: `General (${generalComments?.length || 0})`,
      children: (
        <GeneralComments
          data={generalComments}
          refreshData={fetchGeneralComments}
          version={version}
          quoteRevisionGroupId={quoteRevisionGroupId}
          onMarkAsRead={refetchUnreadComments}
          dealerLogo={dealerLogo}
        />
      ),
    },
    {
      key: "per-item",
      label: `Per item (${itemComments[selectedItemIndex]?.length || 0})`,
      children: (
        <PerItemComments
          items={items}
          version={version}
          quoteRevisionGroupId={quoteRevisionGroupId}
          onMarkAsRead={refetchUnreadComments}
          setItems={setItemComments}
          setIndex={setSelectedItemIndex}
          itemsUnreadCount={itemsUnreadCount}
          dealerItemComments={dealerItemComments}
          refreshData={refreshDealerItemComments}
          dealerLogo={dealerLogo}
        />
      ),
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setIsFullyOpen(true);
      }, 300);

      if (!generalComments) fetchGeneralComments();
    } else {
      setIsFullyOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (divRef.current && divRef.current.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className={`bg-white h-screen overflow-hidden transition-all duration-500 py-40 
        ${isMaskOn ? "z-[999999]" : "z-20"}
        ${
          isOpen ? "w-[500px] px-12" : "w-0 px-0"
        } border-l border-primaryN30 shadow-sm absolute right-0 top-0 zoomed-container`}
    >
      <div className={`${isFullyOpen ? "" : "hidden"}`}>
        <div className="mb-3">
          <p>Comments Panel</p>
          <p className="text-xs text-grey-normal">
            Review all general comments added to this quotii.
          </p>
        </div>
        <ConfigProvider
          theme={{
            components: {
              Tabs: {
                itemSelectedColor: "#5856D7",
                inkBarColor: "#5856D7",
                itemHoverColor: "#5856D7BB",
                itemColor: "#C2C7D0",
                horizontalItemPadding: "6px 0",
              },
            },
          }}
        >
          <Tabs defaultActiveKey="general" items={tabItems} />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default CommentsPanel;

const GeneralComments = ({
  data,
  refreshData,
  version,
  quoteRevisionGroupId,
  onMarkAsRead,
  dealerLogo,
}: any) => {
  const handleMarkAsRead = async (comment: any, isNewMessage: boolean) => {
    if (isNewMessage) {
      const response = await markCommentAsRead(comment.id);
      if (response === "success") {
        refreshData();
        onMarkAsRead();
      }
      return;
    }
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="zoomed-container">
      <div className=" max-h-[40vh] overflow-auto scrollbar-hidden">
        {data.map((comment: any, index: number) => {
          const isDealerComment = comment.platform === "dealer";
          const isNewMessage = comment.is_read === false && !isDealerComment;
          const name = isDealerComment
            ? `${comment.first_name} ${comment.last_name}`
            : "Latii Team";
          return (
            <div key={index}>
              {index !== 0 && <Divider className="bg-primaryN30" />}

              <div
                className="mb-6 flex flex-col gap-1"
                onMouseEnter={() => {
                  if (isNewMessage) handleMarkAsRead(comment, isNewMessage);
                }}
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={
                        isDealerComment
                          ? dealerLogo
                          : "/assets/logos/forum-logo.png"
                      }
                      width={24}
                      height={24}
                      alt="comment user logo"
                      className={`rounded-full ${
                        !isDealerComment && "border border-primaryN30"
                      }`}
                    />
                    <p className="font-bold text-sm">{name}</p>
                    <p className="flex gap-1 items-center text-sm">
                      <span className="text-basicLightGray">
                        {formatDateEnglish(comment.create_time)}
                      </span>
                    </p>
                  </div>
                  {isNewMessage && (
                    <p className="bg-accentIndigo text-white rounded-lg py-1 px-2">
                      New
                    </p>
                  )}
                </div>

                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      {data.length !== 0 && <Divider className="bg-primaryN30" />}
      <AddCommentInput
        refreshData={refreshData}
        version={version}
        quoteRevisionGroupId={quoteRevisionGroupId}
        refetchUnreadComments={onMarkAsRead}
      />
    </div>
  );
};

const PerItemComments = ({
  items,
  version,
  quoteRevisionGroupId,
  onMarkAsRead,
  setItems,
  setIndex,
  itemsUnreadCount,
  dealerItemComments,
  refreshData,
  dealerLogo,
}: any) => {
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const [itemComments, setItemComments] = useState<
    Record<number, ItemComment[]>
  >({});

  useEffect(() => {
    handleSelectItem(0, items[0].revision_group_id);
  }, []);

  const handleSelectItem = async (
    index: number,
    itemRevisionGroupId: string,
  ) => {
    setSelectedItem(index);

    if (!(index in itemComments)) {
      fetchAllItemComments(itemRevisionGroupId, index);
    }
  };

  const handleMarkAsRead = async (
    comment: any,
    isNewMessage: boolean,
    index: number,
  ) => {
    if (isNewMessage) {
      const response = await markCommentAsRead(comment.id);
      if (response === "success") {
        setItemComments((prev: any) => {
          const itemGroup = prev[selectedItem];
          if (!itemGroup) return prev;

          const updatedGroup = [...itemGroup];
          updatedGroup[index] = {
            ...updatedGroup[index],
            is_read: true,
          };

          return {
            ...prev,
            [selectedItem]: updatedGroup,
          };
        });
      }
      onMarkAsRead();
      return;
    }
  };

  const fetchAllItemComments = async (
    itemRevisionGroupId: any,
    index: number,
  ) => {
    // const response = await getAllItemComments(itemRevisionGroupId);
    const response = await getItemCommentsByVersion(
      itemRevisionGroupId,
      version,
    );
    if (response) {
      const comments = response as any;

      setItemComments((prev) => ({
        ...prev,
        [index]: comments,
      }));
      setItems((prev: any) => ({
        ...prev,
        [index]: comments,
      }));
    }
  };

  useEffect(() => {
    setIndex(selectedItem);
  }, [selectedItem]);

  const getItemClassNames = (
    isSelected: boolean,
    itemRevisionGroupId: string,
  ) => {
    const hasLatiiComments = itemsUnreadCount.some(
      (arrItem: any) =>
        arrItem.item_revision_group_id === itemRevisionGroupId &&
        arrItem.internal_count > 0,
    );

    const hasDealerComments = itemsUnreadCount.some(
      (arrItem: any) =>
        arrItem.item_revision_group_id === itemRevisionGroupId &&
        arrItem.dealer_count > 0,
    );

    if (hasLatiiComments) {
      return isSelected
        ? "bg-accentIndigo text-white"
        : "bg-accentIndigo/10 text-accentIndigo";
    }

    if (hasDealerComments) {
      return isSelected
        ? "bg-accentBananas text-white"
        : "bg-accentBananas/10 text-warningW400";
    }

    return isSelected
      ? "bg-basicLightGray text-white"
      : "bg-basicLightGray/45 text-grey-normal";
  };

  return (
    <div className="zoomed-container flex flex-col gap-10">
      <p className="text-xs text-grey-normal">
        Select Item to see comments if available and to add new comments.
      </p>
      <div className="flex gap-14">
        <div className="flex flex-col gap-3 items-center ">
          <p className="text-grey-normal">Items</p>
          <div className="overflow-auto w-10 scrollbar-hidden max-h-80 flex flex-col gap-3">
            {items.map((item: any, index: number) => {
              const isSelected = selectedItem === index;

              return (
                <div className="flex justify-center" key={index}>
                  <div
                    key={index}
                    className={`${getItemClassNames(
                      isSelected,
                      item.revision_group_id,
                    )} rounded-full w-full cursor-pointer hover:opacity-80
                flex justify-center
                `}
                    onClick={() =>
                      handleSelectItem(index, item.revision_group_id)
                    }
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full ">
          <div className="max-h-[40vh] overflow-auto scrollbar-hidden">
            {itemComments[selectedItem]?.map(
              (comment: ItemComment, index: number) => {
                const isDealerComment = comment.platform === "dealer";

                const name = isDealerComment
                  ? `${comment.first_name} ${comment.last_name}`
                  : "Latii Team";
                const isNewMessage =
                  comment.is_read === false && !isDealerComment;
                return (
                  <div key={index}>
                    {index !== 0 && <Divider className="bg-primaryN30" />}

                    <div
                      className="mb-6 flex flex-col gap-1"
                      onMouseEnter={() => {
                        if (isNewMessage)
                          handleMarkAsRead(comment, isNewMessage, index);
                      }}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Image
                            src={
                              isDealerComment
                                ? dealerLogo
                                : `/assets/logos/forum-logo.png`
                            }
                            width={24}
                            height={24}
                            alt="comment user logo"
                            className={`rounded-full ${
                              !isDealerComment && "border border-primaryN30"
                            }`}
                          />
                          <p className="font-bold text-sm">{name}</p>
                          <p className="flex gap-1 items-center text-sm">
                            <span className="text-basicLightGray">
                              {formatDateEnglish(comment.create_time)}
                            </span>
                          </p>
                        </div>
                        {isNewMessage && (
                          <p className="bg-accentIndigo text-white rounded-lg py-1 px-2">
                            New
                          </p>
                        )}
                      </div>

                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
          {itemComments[selectedItem]?.length !== 0 && (
            <Divider className="bg-primaryN30" />
          )}
          <AddCommentInput
            refreshData={() => {
              fetchAllItemComments(
                items[selectedItem].revision_group_id,
                selectedItem,
              );
              refreshData();
            }}
            version={version}
            quoteRevisionGroupId={quoteRevisionGroupId}
            itemRevisionGroupId={items[selectedItem].revision_group_id}
            refetchUnreadComments={onMarkAsRead}
          />
        </div>
      </div>
    </div>
  );
};

const AddCommentInput = ({
  refreshData,
  version,
  quoteRevisionGroupId,
  itemRevisionGroupId = null,
  refetchUnreadComments,
}: any) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleSendComment = async (content: string) => {
    if (!content) return;
    setInputValue("");
    setIsLoading(true);
    const response = await createComment({
      content,
      quoteRevisionGroupId,
      version: version,
      type: itemRevisionGroupId ? "ITEM" : "GENERAL",
      itemRevisionGroupId,
    });
    setIsLoading(false);
    if (response !== "success") {
      notification.error({
        message: "Error sending comment",
        description: "An unexpected error occurred.",
        duration: 7,
      });
      return;
    }
    if (refetchUnreadComments) refetchUnreadComments();
    refreshData();
  };

  return (
    <div className="flex gap-6 items-start ">
      <Input.TextArea
        disabled={isLoading}
        placeholder="Add a comment"
        rows={4}
        style={{ resize: "none" }}
        onChange={(e) => handleInputChange(e)}
        value={inputValue}
        className="scrollbar-hidden"
      />
      <Image
        src="/assets/icons/send-comment.svg"
        width={27}
        height={22}
        alt="send comment icon"
        className={`w-7 h-auto ${
          isLoading || inputValue.length === 0
            ? "cursor-default opacity-40"
            : "cursor-pointer hover:opacity-80"
        }`}
        onClick={() => handleSendComment(inputValue)}
      />
    </div>
  );
};
