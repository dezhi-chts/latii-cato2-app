"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Divider,
  Input,
  notification,
  UploadFile,
  Table,
  Button,
  Image,
  Spin,
  Modal,
} from "antd";

import { reconcileDefault } from "@/services/DrawingAiService";
import { getEvidenceByFileId } from "@/services/evidenceService";
import { getTakeOffsDetails } from "@/services/takeOffService";

import { colorList } from "@/theme/colors";
import CustomizeTable from "./components/CustomizeTabel";
import FinalTable from "./components/FinalTable";
const ItemsMerge = () => {
  const router = useRouter();
  const takeOffId = Number(useParams().takeoffId);
  const projectId = Number(useParams().projectId);
  const fileId = Number(useSearchParams().get("_fId")) || "";
  const [fullLoading, setFullLoading] = useState(false);
  const [groupList, setGroupList] = useState<any>([]);
  const [selectGroupIndex, setSelectGroupIndex] = useState<number>(-1);

  const [selectedTab, setSelectedTab] = useState<"customize" | "keepAll">(
    "customize",
  );

  const [evidenceList, setEvidenceList] = useState<any>([]);
  const [defaultFields, setDefaultFields] = useState<any>([]);
  const allItems = useRef([]);
  const fileAllEvidence = useRef([]);
  const [customizeTableData, setCustomizeTableData] = useState<any>([]);

  // 原始表格数据
  const originTabelData = useMemo(() => {
    if (selectGroupIndex < 0) return [];
    let group = groupList[selectGroupIndex];
    let list = allItems.current.filter((item: any) =>
      group?.item_ids?.includes(item.id),
    );

    return list;
  }, [allItems.current, selectGroupIndex]);

  useEffect(() => {
    getTakeOff();
    fetchEvidence();
  }, []);

  useEffect(() => {
    setEvidenceList([]);
    if (selectGroupIndex >= 0) {
      setSelectedTab("customize");
      // 生成默认的selectedFields
      fetchDefaultFiled();
      // 显示evidence
      showEvidence();
    }
  }, [selectGroupIndex]);

  useEffect(() => {
    // 切换tab时，重置表格相关信息
    if (selectedTab === "customize") {
      // evidence设置默认选中
      setEvidenceList((prev: any[]) => {
        return prev.map((item) => ({ ...item, evidence_selected: true }));
      });
    } else {
      // evidence设置默认不选中
      setEvidenceList((prev: any[]) => {
        return prev.map((item) => ({ ...item, evidence_selected: true }));
      });
    }
  }, [selectedTab]);

  // 获取重复group，目前根据takeoff details API获取
  const getTakeOff = async () => {
    setFullLoading(true);
    const response = await getTakeOffsDetails(takeOffId as any);
    setFullLoading(false);
    if (response.status === "success") {
      let res = response.data;
      const exist = res?.take_off_result?.status === 2;
      if (exist) {
        allItems.current = res?.all_items?.[fileId] ?? [];
        let items = res?.reconcile_candidates?.[fileId] ?? [];
        setGroupList(items ?? []);
        if (items.length > 0) {
          setSelectGroupIndex(0);
        } else {
          setSelectGroupIndex(-1);
        }
      }
    } else {
      notification.error({
        message: "Error",
        description: "Get TakeOffs Details Failed",
      });
    }
  };

  // 获取默认的selectedFields
  const fetchDefaultFiled = async () => {
    let findGroup = groupList[selectGroupIndex];
    let itemsFields = findGroup?.items.map((item: any) => ({
      item_id: item.id,
      fields: [],
    }));

    let body = {
      take_off_id: takeOffId,
      item_fields: itemsFields,
    };
    const response = await reconcileDefault(body);
    if (response.status === "success") {
      // 保存默认的selectedFields
      setDefaultFields(response.data?.item_fields || []);
    } else {
      notification.error({
        message: "Error",
        description: "Get Default Fields Failed",
      });
    }
  };

  // 获取evidence
  const fetchEvidence = async () => {
    //默认取groupId所在items中的project_file_id
    let res = await getEvidenceByFileId(projectId as any, fileId as number);
    if (res.status === "success") {
      fileAllEvidence.current = res?.data || [];
    } else {
      notification.error({
        message: "Error",
        description: "Get Evidence Failed",
      });
    }
  };

  const showEvidence = () => {
    //获取originTable中所有evidence的集合
    let evidences: any[] = [];
    originTabelData.forEach((item: any, index: number) => {
      let evid: any = fileAllEvidence.current.find((evidence: any) =>
        item?.evidence_id_list?.includes(evidence.id),
      );
      if (evid) {
        evidences.push({
          ...evid,
          index: index,
          item_id: item.id,
          evidence_selected: true,
        });
      }
    });
    setEvidenceList(evidences);
  };

  const renderGrouplList = () => {
    let list = groupList.map((group: any, index: number) => {
      return (
        <div
          key={index}
          className="p-2 text-xs border rounded-md gap-1 cursor-pointer"
          style={{
            borderColor:
              selectGroupIndex === index
                ? colorList.forumBlue - normal
                : colorList.primaryN30,
          }}
          onClick={() => setSelectGroupIndex(index)}
        >
          <div className="">Label</div>
          <p className="text-grey-normal">
            {"Items " + group?.items?.map((item: any) => item.id).join(", ")}
          </p>
        </div>
      );
    });
    return list;
  };

  const handleEvidenceChecked = (index: number) => {
    if (selectedTab === "keepAll") return;
    setEvidenceList((prev: any[]) => {
      return prev.map((item: any, i: number) => {
        if (i === index) {
          return { ...item, evidence_selected: !item.evidence_selected };
        }
        return { ...item };
      });
    });
  };

  return (
    <div className="w-full h-[100vh] px-20 pb-5 flex flex-col">
      <div className="py-10 mb-3 flex flex-row items-center gap-6">
        <div
          onClick={() => router.back()}
          className="flex gap-1.5 items-center group cursor-pointer"
        >
          <Image
            src="/assets/icons/arrow-back.svg"
            alt="go back"
            width={20}
            height={20}
            preview={false}
            style={{ width: "auto", height: "auto" }}
            className="cursor-pointer"
          />
        </div>
        <span className="text-sm text-basicLightGray">Back to Items</span>
      </div>

      <div className="flex-1 flex flex-row">
        <div className="w-[195px] h-full pr-[25px] border-r border-primaryN30">
          <div className="mb-6">
            <p className="text-base text-forumBlue-normal mb-1">
              Reconcile Panel
            </p>
            <p className="text-xs text-grey-normal">Handle these duplicates.</p>
          </div>

          <div className="flex flex-col gap-3">{renderGrouplList()}</div>
        </div>
        <div className="px-5 flex-1 flex flex-col gap-3">
          <div className="flex text-xs text-grey-normal">
            <div
              className={`px-3 h-[26px] flex items-center rounded-tl-md rounded-bl-md transition-colors cursor-pointer 
                                bg-${selectedTab === "customize" ? "primaryN30" : "primaryN20"}
                                font-${selectedTab === "customize" ? "bold" : "normal"}
                            `}
              onClick={() => setSelectedTab("customize")}
            >
              Customize
            </div>
            <div
              className={`ml-[1px] px-3 h-[26px] flex items-center  rounded-tr-md rounded-br-md transition-colors cursor-pointer 
                                bg-${selectedTab === "keepAll" ? "primaryN30" : "primaryN20"}
                                font-${selectedTab === "keepAll" ? "bold" : "normal"}
                            `}
              onClick={() => setSelectedTab("keepAll")}
            >
              Keep All
            </div>
          </div>
          <div>
            <CustomizeTable
              selectedTab={selectedTab}
              originTableData={originTabelData}
              defaultFields={defaultFields}
              setCustomizeTableData={setCustomizeTableData}
            />
          </div>

          {/** 显示evidence  */}
          <div className="my-4 flex flex-row gap-5 flex-wrap">
            {evidenceList.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  className="w-[30%] min-w-[30%] h-[300px] border border-primaryN30 rounded-lg"
                >
                  <div className="flex flex-row p-4 gap-6">
                    <div className="px-1 h-[16px] text-xs text-grey-normal bg-primaryN30 rounded">
                      {item.index + 1}
                    </div>
                    <div className="flex-1">
                      <Image
                        src={item.evidence_url ?? ""}
                        alt={""}
                        width={"100%"}
                        height={"auto"}
                        className="mt-2 max-h-[250px] object-contain"
                        preview={false}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div
                        className={`w-[30px] h-[30px] flex items-center justify-center rounded-md transition-colors cursor-pointer 
                                                `}
                        style={{
                          border: item.evidence_selected
                            ? `1px solid ${colorList.forumBlue - normal}`
                            : "1px solid transparent",
                          backgroundColor: item.evidence_selected
                            ? colorList.forumBlue - normal + "20"
                            : "transparent",
                        }}
                        onClick={() => handleEvidenceChecked(index)}
                      >
                        <Image
                          src="/assets/icons/file-refrence.svg"
                          alt=""
                          width={18}
                          height={18}
                          preview={false}
                          style={{
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <FinalTable
              selectedTab={selectedTab}
              groupIndex={selectGroupIndex}
              originTableData={customizeTableData}
              evidenceList={evidenceList}
              setFullLoading={setFullLoading}
              onRefreshGroups={() => {
                getTakeOff();
              }}
            />
          </div>
        </div>
      </div>

      {fullLoading && (
        <Spin
          spinning={fullLoading}
          className="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-[#ffffff90]"
        ></Spin>
      )}
    </div>
  );
};

export default ItemsMerge;
