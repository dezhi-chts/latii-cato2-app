"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Input,
  Flex,
  Popconfirm,
  Select,
  Modal,
  Radio,
  Divider,
  Descriptions,
  TreeSelect,
  Tooltip,
  Button,
  Checkbox,
  Image as AntdImage,
  notification,
} from "antd";
import {
  DatabaseOutlined,
  PlusCircleTwoTone,
  PlusCircleFilled,
  RightOutlined,
  SaveOutlined,
  ProfileOutlined,
  FolderViewOutlined,
  RadiusBottomleftOutlined,
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  LeftOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { OptionMsgVO } from "@/app/brand-editor/components/body-components/validators";
import { fetchOptionsByProductAttrId } from "@/services/productBaseEditorService";

const OptionItemCom = (props: any) => {
  const [optionItemMsg, setOptionItemMsg] = useState<OptionMsgVO>(
    props.optionItemMsg,
  );
  const [setedOptionLibraryList, setSetedOptionLibraryList] = useState<any[]>(
    props.setedOptionLibraryList,
  );
  const [isSubOptionsModalOpen, setIsSubOptionsModalOpen] =
    useState<boolean>(false);
  const [allSubOptions, setAllSubOptions] = useState<any[]>([]);

  useEffect(() => {
    setOptionItemMsg(props.optionItemMsg);
  }, [props.optionItemMsg]);

  useEffect(() => {
    setSetedOptionLibraryList(props.setedOptionLibraryList);
  }, [props.setedOptionLibraryList]);

  const addSubOptionHandler = () => {
    props.addSubOptionHandler(optionItemMsg);
  };

  const addSiblingOptionHandler = () => {
    props.addSiblingOptionHandler(optionItemMsg);
  };

  const copyNode = () => {
    props.copyNode(optionItemMsg);
  };

  const deleteNode = () => {
    props.deleteNode(optionItemMsg);
  };

  const onChangeAttribute = (attributeCode: string) => {
    props.onChangeAttribute(attributeCode, optionItemMsg);
  };

  // const onChangeOption = (optionCode: string) => {
  // 	props.onChangeOption(optionCode, optionItemMsg)
  // };

  const onSelectedSubOption = async () => {
    if (!optionItemMsg?.attribute) {
      notification.warning({
        message: "Warning",
        description: "Please select Option Selection",
      });
      return;
    }
    await getOptions(optionItemMsg?.attributeMsg?.id);
    setIsSubOptionsModalOpen(true);
  };

  const getOptions = async (productAttributeId: number) => {
    const optionsRes = await fetchOptionsByProductAttrId(productAttributeId);
    if (optionsRes.status === "success") {
      const tempData = optionsRes?.data || [];

      tempData.forEach((item: any) => {
        if (!item?.other_msg) {
          // 如果没有 other_msg，直接赋空对象
          item.other_msg = {};
        } else {
          try {
            item.other_msg = JSON.parse(item.other_msg);
          } catch (err) {
            // 解析失败，也赋空对象
            item.other_msg = {};
          }
        }
      });
      tempData.forEach((item: any) => {
        item.checked = false;
        item.isShow = true;
        if (Array.isArray(optionItemMsg.option)) {
          optionItemMsg.option.forEach((item1: any) => {
            if (item?.code == item1) {
              item.checked = true;
            }
          });
        } else {
          if (optionItemMsg.option == item?.code) {
            item.checked = true;
          }
        }
      });
      setAllSubOptions([...tempData]);
    }
  };

  const onChecked = (e: any, $index: number) => {
    allSubOptions[$index]["checked"] = e.target.checked;
    setAllSubOptions([...allSubOptions]);
  };

  const onSelectAll = () => {
    allSubOptions.forEach((item: any) => {
      item.checked = true;
    });
    setAllSubOptions([...allSubOptions]);
  };

  const onUnselectAll = () => {
    allSubOptions.forEach((item: any) => {
      item.checked = false;
    });
    setAllSubOptions([...allSubOptions]);
  };

  const onSearchSubOption = (e: any) => {
    const keyword = e?.target?.value;
    allSubOptions.forEach((item: any) => {
      item.isShow = false;
      if (item.name && item.name.toLowerCase().includes(keyword)) {
        item.isShow = true;
      }
    });
    setAllSubOptions([...allSubOptions]);
  };

  const onSureSubOption = () => {
    let selectedOptions: string[] = [];
    allSubOptions.forEach((item) => {
      if (item.checked) {
        selectedOptions.push(item.code);
      }
    });
    props.onChangeOption(selectedOptions, optionItemMsg);

    setIsSubOptionsModalOpen(false);
  };

  return (
    <div className="flex text-[12px]">
      <div className="flex flex-col items-center">
        <div
          className="border border-[#E8E8E8]"
          style={{
            width: "300px",
            borderRadius: "6px",
          }}
        >
          <div className="flex w-full items-center border-b border-[#E8E8E8] p-4">
            <Select
              placeholder="Option Selection"
              size="small"
              className="w-full placeholder-text-12"
              options={(setedOptionLibraryList || []).map(
                (v: Record<string, any>) => ({
                  value: v.code,
                  label: `${v?.title}`,
                }),
              )}
              onChange={onChangeAttribute}
              value={optionItemMsg.attribute || undefined}
            ></Select>
            <div className="flex text-[#B1B1B1] ml-2">
              <Tooltip title="Copy" placement="top">
                <CopyOutlined
                  className="ml-2 cursor-pointer"
                  onClick={copyNode}
                />
              </Tooltip>
              <Tooltip title="Delete" placement="top">
                <Popconfirm
                  title="Delete the item"
                  description="Are you sure to delete this item?"
                  onConfirm={deleteNode}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="ml-2 cursor-pointer" />
                </Popconfirm>
              </Tooltip>
              {optionItemMsg.children.length > 0 && (
                <>
                  {!optionItemMsg._collapsed ? (
                    <Tooltip title="Fold" placement="top">
                      <LeftOutlined
                        className="ml-2 cursor-pointer"
                        onClick={() => props.onToggleHandler(optionItemMsg.id)}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Unfold" placement="top">
                      <RightOutlined
                        className="ml-2 cursor-pointer"
                        onClick={() => props.onToggleHandler(optionItemMsg.id)}
                      />
                    </Tooltip>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex mt-2 w-full items-start p-4 flex-col">
            <div className="flex w-full justify-between items-center">
              <span className="text-[#717171]">Available Options</span>
              <div
                onClick={onSelectedSubOption}
                className="w-[48px] h-[21px] flex items-center justify-center rounded-md bg-[#ECF2FA] text-[#1E385D] cursor-pointer"
              >
                Edit
              </div>
            </div>
            <div className="mt-2">
              {Array.isArray(optionItemMsg.option) && (
                <div>
                  {Array.isArray(optionItemMsg.optionMsg) &&
                    optionItemMsg.optionMsg.map((item: any, index: any) => {
                      return (
                        <div key={index} className="flex mb-2 items-center">
                          <span className="px-2 text-[12px] bg-[#F8F8F8] text-[#717171] rounded-[4px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="ml-2">{item?.name}</span>
                        </div>
                      );
                    })}
                </div>
              )}
              {!Array.isArray(optionItemMsg.option) && (
                <div>
                  {optionItemMsg.option &&
                    !Array.isArray(optionItemMsg.optionMsg) && (
                      <div className="flex mb-2 items-center">
                        <span className="px-2 text-[12px] bg-[#F8F8F8] text-[#717171] rounded-[4px] flex items-center justify-center">
                          {1}
                        </span>
                        <span className="ml-2">
                          {optionItemMsg?.optionMsg?.name}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
        {
          <div className="flex items-center flex-col flex-1">
            <div className="border-l flex-1 min-h-5 border-[#DCDCDC]"></div>
            <div
              onClick={addSiblingOptionHandler}
              className={`w-[25px] h-[25px] rounded-[100%] bg-[#E3EBF8] flex items-center justify-center cursor-pointer ${optionItemMsg._isLastOneAtThisLevel && "mb-10"}`}
            >
              <PlusOutlined className="text-[#427CCE]" />
            </div>
            {!optionItemMsg._isLastOneAtThisLevel && (
              <div className="border-l flex-1 min-h-5 border-[#DCDCDC]"></div>
            )}
          </div>
        }
      </div>

      <div className="text-grey-normal relative flex h-[150px]">
        <div className="flex items-center">
          <div className="border-b w-[20px] border-[#DCDCDC]"></div>
          <div
            onClick={addSubOptionHandler}
            className={`w-[25px] h-[25px] rounded-[100%] bg-[#E3EBF8] flex items-center justify-center cursor-pointer`}
          >
            <PlusOutlined className="text-[#427CCE]" />
          </div>
          {optionItemMsg.children.length > 0 && !optionItemMsg._collapsed && (
            <div className="border-b w-[20px] border-[#DCDCDC]"></div>
          )}
        </div>
      </div>
      <Modal
        title={<div className="text-[#427CCE]">Available Sub-Options</div>}
        closable={false}
        open={isSubOptionsModalOpen}
        footer={null}
        destroyOnHidden={true}
        width={"1200px"}
      >
        <div className="h-[calc(100vh-200px)]">
          <div className="flex items-center">
            <Input
              placeholder="Please input"
              prefix={<SearchOutlined className="text-[#98A1B0]" />}
              className="w-[350px]"
              onChange={onSearchSubOption}
            />
            <Button className="ml-6" onClick={onUnselectAll}>
              Unselect All
            </Button>
            <Button className="ml-6" onClick={onSelectAll}>
              Select All
            </Button>
          </div>
          <div className="h-[calc(100%-90px)] overflow-y-auto">
            <div className="mt-4 flex flex-wrap items-start text-[12px] gap-4">
              {allSubOptions &&
                allSubOptions.length != 0 &&
                allSubOptions.map((item, index) => {
                  return item.isShow ? (
                    <div
                      key={index}
                      className="w-[370px] h-[180px] border border-[#E8E8E8] rounded-md flex-none"
                    >
                      <div className="flex justify-between items-center p-2 px-4 border-b border-b-[#E8E8E8]">
                        <div className="flex items-center">
                          <span className="px-2 text-[12px] bg-[#F8F8F8] text-[#717171] rounded-[4px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="ml-4">{item?.name}</span>
                        </div>
                        <Checkbox
                          checked={item?.checked}
                          onChange={(e) => onChecked(e, index)}
                        ></Checkbox>
                      </div>
                      <div className="flex p-4 h-[calc(100%-40px)] overflow-y-auto">
                        <div className="w-[65px] h-[65px]">
                          {item?.other_msg?.file_key && (
                            <div className="w-[65px] h-[65px] mx-auto rounded-md border border-dashed border-[#E8E8E8] overflow-hidden flex items-center justify-center bg-[#fafafa]">
                              <AntdImage
                                src={item?.other_msg?.file_url}
                                className="block"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                  margin: "auto",
                                }}
                                preview={{
                                  mask: (
                                    <div className="flex items-center justify-center gap-3 text-white">
                                      <EyeOutlined className="text-[16px] cursor-pointer" />
                                    </div>
                                  ),
                                  maskClassName: "rounded-md",
                                }}
                              />
                            </div>
                          )}
                          {!item?.other_msg?.file_key && (
                            <div className="w-[65px] text-[9px] h-[65px] mx-auto rounded-md border border-dashed border-[#E8E8E8] overflow-hidden flex items-center justify-center bg-[#fafafa]">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <div className="text-[#717171]">Description</div>
                          <div>{item?.description || "None"}</div>
                          <div className="text-[#717171] mt-2">Hint Text</div>
                          <div className="pb-2">{item?.detail || "None"}</div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsSubOptionsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="ml-4"
              type="primary"
              onClick={() => onSureSubOption()}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      <style global jsx>
        {`
          .placeholder-text-12 .ant-select-selection-placeholder {
            font-size: 12px;
          }
        `}
      </style>
    </div>
  );
};

export default OptionItemCom;
