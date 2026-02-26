"use client";

import Button from "@/components/Button";
import { Checkbox, Divider, Input, Table } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";

import { getFieldsByTemplateId } from "@/services/templateService";
import { colorList } from "@/theme/colors";

const ItemsTable = ({ takeOff }: any) => {
  const [filter, setFilter] = useState("");
  const [repeatGroups, setRepeatGroups] = useState<number>(0);

  const defaultColumns = [
    {
      title: "State",
      dataIndex: "state",
      width: 60,
      fixed: "left",
      align: "center",
      render: (_: any, record: any) => {
        return (
          <div className="flex items-center justify-center">
            <div
              className="w-[16px] h-[16px] rounded-full bg-transparent border border-basicLightGray"
              style={{
                backgroundColor:
                  record.state === "active" ? "green" : "transparent",
              }}
            ></div>
          </div>
        );
      },
    },
    {
      title: "#",
      dataIndex: "number",
      width: 50,
      fixed: "left",
      align: "center",
      render: (_: any, record: any, index: number) => index + 1,
    },
    {
      title: "Label",
      dataIndex: "label",
      width: 120,
      fixed: "left",
      align: "center",
      render: (_: any, record: any) => {
        try {
          return JSON.parse(record.result).label;
        } catch (e) {
          return "";
        }
      },
    },
  ];

  const [columns, setColumns] = useState(defaultColumns);

  // 存储勾选的行 key
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 配置勾选功能
  const rowSelection = {
    selectedRowKeys, // 受控绑定勾选的行 key
    onChange: (newSelectedRowKeys: string[]) => {
      // 勾选状态变化时触发
      console.log("勾选的行 key：", newSelectedRowKeys);
      setSelectedRowKeys(newSelectedRowKeys);
    },
    // 可选配置：是否允许全选
    // selectAll: false, // 禁用全选
    // 可选配置：勾选框渲染（如自定义样式）
    // renderCell: (checked, record, index, originNode) => {
    //   return <Checkbox checked={checked} />;
    // },
  };

  useEffect(() => {
    //获取重复组数
    if (takeOff?.all_items?.length > 0) {
      let repeatGroupsMap: { [key: string]: number } = {};
      let items = takeOff?.all_items;
      //计算items中有多少组重复的label
      items.map((item: any) => {
        try {
          let label = JSON.parse(item.result)["Product Type"];
          if (repeatGroupsMap[label]) {
            repeatGroupsMap[label] += 1;
          } else {
            repeatGroupsMap[label] = 1;
          }
        } catch (e) {
          console.log(e);
        }
      });
      console.log("########## repeatGroupsMap: ", repeatGroupsMap);
      //计算map中每个数量大于1的label的数量
      let repeatGroups = 0;
      for (let key in repeatGroupsMap) {
        if (repeatGroupsMap[key] > 1) {
          repeatGroups += 1;
        }
      }
      setRepeatGroups(repeatGroups);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const res = await getFieldsByTemplateId(
        takeOff?.take_off_result?.template_id,
      );
      if (res.status === "success") {
        let columnsList = [...columns];
        res.data.map((field: { name: string }) => {
          if (
            typeof field.name === "string" &&
            field.name.toUpperCase() === "LABEL"
          )
            return;
          let title = "";
          let splitArr = field.name.split(".");
          if (splitArr.length > 1) {
            splitArr.map((item, index) => {
              if (index === 0) {
                title = item + "\n";
              } else {
                title += item + "";
              }
            });
          } else {
            title = field.name;
          }
          columnsList.push({
            title: <span className="whitespace-pre-wrap">{title}</span>,
            dataIndex: field.name,
            width: field?.name?.length > 20 ? 200 : 120,
            align: "center",
            render: (_: any, record: any) => {
              try {
                return JSON.parse(record.result)[field.name];
              } catch (e) {
                return "";
              }
            },
          } as any);
        });
        setColumns(columnsList);
      }
    })();
  }, [takeOff?.take_off_result?.template_id]);

  const tableData = takeOff?.all_items || [];
  return (
    <div className="flex flex-col gap-4 w-full pt-8">
      <p className="text-forumBlue-normal text-sm">Items</p>
      <div className="flex justify-between w-full">
        <Input
          className="rounded-full w-80 text-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          prefix={
            <Image
              src="/assets/icons/search.svg"
              alt="search icon"
              width={11}
              height={11}
            />
          }
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            borderColor="primaryN30"
            className="!text-grey-normal text-xs"
          >
            <div className="flex items-center justify-center">
              <span>Reconcile Items</span>
              <span
                className="ml-1 px-[6px] py-[1px] rounded-2xl inline-block text-white text-sm"
                style={{
                  backgroundColor:
                    repeatGroups > 0
                      ? colorList.grey - normal
                      : colorList.green - normal,
                }}
              >
                {repeatGroups}
              </span>
            </div>
          </Button>
          {/* <Button variant="outline" borderColor="forumBlue-normal" className="text-xs">
                    Add Item
                </Button> */}
        </div>
      </div>
      <div className="">
        <Table
          rowKey={(record: any) => record.id}
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          rowSelection={{ ...rowSelection }}
          scroll={{
            x: "max-content",
            y: "max-content",
          }}
        />
      </div>
    </div>
  );
};

export default ItemsTable;
