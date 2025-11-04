import styles from "./upload.item.image.module.css";
import http from "@/lib/http";
import {
  DeleteOutlined
} from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Empty,
  InputNumber,
  Layout,
  notification,
  Result,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tooltip,
  Radio,
  Upload,
  Image as AntdImage,
} from "antd";
import { useState, useEffect, useRef, useCallback } from "react";
import FoldingSelect from "../folding-select";
import OperabilitySelect from "../operability-select";

const { Dragger } = Upload;

interface UploadItemImageProps {
  currentItem: any;
  from: string;
  handleUpdateQuote: (e: any) => void;
  setIsOpenUploadBox: () => void;
}

const UploadItemImage = ({
  currentItem,
  from,
  handleUpdateQuote,
  setIsOpenUploadBox,
}: UploadItemImageProps) => {
  const [item, setItem] = useState<any>(currentItem);
  useEffect(() => {
    setItem(currentItem);
  }, [currentItem]);

  const [isUploadLoading, setIsUploadLoading] = useState<any>(false);
  const [uploadImageValid, setUploadImageValid] = useState(false);
  useEffect(() => {
    if (item?.image?.upload_image_url) {
      checkImageUrl(item.image.upload_image_url).then((valid) => {
        setUploadImageValid(valid);
      });
    } else {
      setUploadImageValid(false);
    }
  }, [item.image]);

  const checkImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const onChangeCategory = (val: any) => {
    item.item_type.selected_value = val;
    item.image.current_selected_mode = "upload";
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const onChangeProduct = (val: any, $unitIndex: any) => {
    item.units[$unitIndex].product.selected_value = val;
    item.image.current_selected_mode = "upload";
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const onChangeProductType = (val: any, $unitIndex: any) => {
    item.units[$unitIndex].product_type.selected_value = val;
    item.image.current_selected_mode = "upload";
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const onChangeOperability = (val: any, $unitIndex: any) => {
    item.units[$unitIndex].operability.selected_value = val;
    item.image.current_selected_mode = "upload";
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const onChangeWidth = (val: any, $unitIndex: any) => {
    item.units[$unitIndex].width_input = val;
    item.image.current_selected_mode = "upload";
    item.units[$unitIndex].shape = "";
    item.units[$unitIndex].shape_data = {
      area: 0,
    };
    if (
      item.units[$unitIndex].width_input &&
      item.units[$unitIndex].height_input
    ) {
      item.units[$unitIndex].shape_data.area =
        item.units[$unitIndex].width_input *
        item.units[$unitIndex].height_input;
    }
    item.units[$unitIndex].shape_data = JSON.stringify(
      item.units[$unitIndex].shape_data
    );
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const onChangeHeight = (val: any, $unitIndex: any) => {
    item.units[$unitIndex].height_input = val;
    item.image.current_selected_mode = "upload";
    item.units[$unitIndex].shape = "";
    item.units[$unitIndex].shape_data = {
      area: 0,
    };
    if (
      item.units[$unitIndex].width_input &&
      item.units[$unitIndex].height_input
    ) {
      item.units[$unitIndex].shape_data.area =
        item.units[$unitIndex].width_input *
        item.units[$unitIndex].height_input;
    }
    item.units[$unitIndex].shape_data = JSON.stringify(
      item.units[$unitIndex].shape_data
    );
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const hasCorner = (options: any) => {
    return options?.some((option: any) => option?.value?.includes("corner"));
  };

  const onChangeDividers = (val: any, $unitIndex: any, dividerType: any) => {
    let divider_data: any = [];
    if (dividerType == "sdl") {
      if (val) {
        divider_data = [
          {
            divided_lite_type: "sdl",
            divided_lite_type_text: "SDL",
            dividers_arrangement: "",
            dividers_arrangement_text: "",
            length: null,
          },
        ];
      }
    } else if (dividerType == "tdl") {
      if (val) {
        divider_data = [
          {
            divided_lite_type: "tdl",
            divided_lite_type_text: "TDL",
            dividers_arrangement: "",
            dividers_arrangement_text: "",
            length: null,
          },
        ];
      }
    } else if (dividerType == "none") {
      if (val) {
        divider_data = [];
      }
    }
    item.units[$unitIndex].divider_data = JSON.stringify(divider_data);
    item.image.current_selected_mode = "upload";
    handleUpdateQuote(item);
    setItem({
      ...item,
    });
  };

  const handleUpload = ({ file }: any) => {
    setIsUploadLoading(true);
    let item_id = item.id;
    let type = "upload";
    let formData = new FormData();
    formData.append("file", file);
    http
      .post(`/quote/upload_quote_image/${item_id}/type/${type}`, formData)
      .then(() => {
        item.image.current_selected_mode = type;
        handleUpdateQuote(item);
        setItem({
          ...item,
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setIsUploadLoading(false);
      });
  };

  const handleAddUnit = () => {
    item.units.push({
      line: item.units.length + 1
    })
    handleUpdateQuote(item);
  };

  const handleDeleteUnit = (unitIndex: number) => {
    if (item.units.length <=1){
      notification.warning({
        message: "Warning message",
        description:
          "At least one is needed.",
      });
      return;
    }
    item.units.splice(unitIndex,1)
    handleUpdateQuote({...item});
  }

  return (
    <div className={styles.upload_item_image_box}>
      <div className={styles.left_box}>
        <div className={styles.title}>Item Specifications</div>
        <div style={{ color: "#717171", fontSize: "12px" }}>
          Try to input as much data as you can, use notes section to fill more
          information if needed.
        </div>
        <div className={styles.unit_box}>
          <Row gutter={[16, 24]} style={{ marginTop: "24px" }}>
            <Col span={24}>
              <div className="flex items-center w-full">
                <span className="w-2/12 text-gray-400 text-xs">Category</span>
                <div className="w-10/12">
                  <Select
                    placeholder="Category"
                    value={item.item_type?.selected_value}
                    className="rounded-full"
                    style={{ width: "100%" }}
                    onChange={onChangeCategory}
                  >
                    {item.item_type?.options?.map((option: any) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.text}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </div>
            </Col>
            {item.units.map((unitItem: any, unitIndex: any) => {
              return (
                <div key={unitItem.id} className={styles.unit_item_box}>
                  {
                    item.is_system &&  <div style={{display:"flex",marginBottom:"10px",justifyContent:"space-between",alignItems:"center",color:"#091E42",padding:"0px 10px"}}>
                      <span style={{color:"#091E42",fontWeight:"bold"}}>Sub Item {unitItem.line}</span>
                      <span className="flex">
                        {
                          <span className="mr-2" onClick={()=>handleDeleteUnit(unitIndex)} style={{display:"flex",cursor:"pointer",fontSize:"16px",width:"30px",height:"30px",justifyContent:"center",alignItems:"center",background:"#EBEDF0",borderRadius:"100%"}}>
                            <DeleteOutlined />
                          </span>
                        }
                        {
                          unitIndex==0 && <span onClick={handleAddUnit} style={{display:"flex",cursor:"pointer",fontSize:"16px",width:"30px",height:"30px",justifyContent:"center",alignItems:"center",background:"#EBEDF0",borderRadius:"100%"}}>+</span>
                        }
                      </span>
                    </div>
                  }
                  <Col span={24}>
                    <div className="flex items-center w-full">
                      <span className="w-2/12 text-gray-400 text-xs">
                        Product
                      </span>
                      <div className="w-10/12">
                        <Select
                          placeholder="Product"
                          value={unitItem.product?.selected_value}
                          className="rounded-full"
                          style={{ width: "100%" }}
                          onChange={(val: any) => {
                            onChangeProduct(val, unitIndex);
                          }}
                          disabled={unitItem.product?.disabled}
                        >
                          {unitItem.product?.options?.map((option: any) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              {option.text}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <div className="flex items-center w-full">
                      <span className="w-2/12 text-gray-400 text-xs">Type</span>
                      <div className="w-10/12">
                        <Select
                          placeholder="Type"
                          value={unitItem.product_type?.selected_value}
                          className="rounded-full"
                          style={{ width: "100%" }}
                          onChange={(val: any) => {
                            onChangeProductType(val, unitIndex);
                          }}
                          disabled={unitItem.product_type?.disabled}
                        >
                          {unitItem.product_type?.options?.map(
                            (option: any) => (
                              <Select.Option
                                key={option.value}
                                value={option.value}
                              >
                                {option.text}
                              </Select.Option>
                            )
                          )}
                        </Select>
                      </div>
                    </div>
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <div className="flex items-center w-full">
                      <span className="w-2/12 text-gray-400 text-xs">Open</span>
                      <div className="w-10/12">
                        {unitItem?.selected_value == "56" ? (
                          <FoldingSelect
                            handleSelectChange={(
                              value: string,
                              index: number,
                              type: string
                            ) => {
                              onChangeOperability(value, unitIndex);
                            }}
                            index={unitIndex}
                            options={unitItem.operability?.options}
                            operability={{
                              selected_value:
                                unitItem.operability?.selected_value,
                              options: unitItem.operability?.options,
                            }}
                          />
                        ) : hasCorner(unitItem.operability?.options) ? (
                          <OperabilitySelect
                            operability={{
                              selected_value:
                                unitItem.operability?.selected_value,
                              options: unitItem.operability?.options,
                            }}
                            handleSelectChange={(
                              value: string,
                              index: number,
                              type: string
                            ) => {
                              onChangeOperability(value, unitIndex);
                            }}
                            index={unitIndex}
                            options={unitItem.operability?.options}
                          />
                        ) : (
                          <Select
                            placeholder="Open, Hinge, etc."
                            value={unitItem.operability?.selected_value}
                            className="rounded-full"
                            style={{ width: "100%" }}
                            onChange={(val: any) => {
                              onChangeOperability(val, unitIndex);
                            }}
                            disabled={unitItem.operability?.disabled}
                          >
                            {unitItem.operability?.options?.map(
                              (option: any) => (
                                <Select.Option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.text}
                                </Select.Option>
                              )
                            )}
                          </Select>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <div className="flex w-full items-center">
                      <span className="w-2/12 text-gray-400 text-xs">
                        Width
                      </span>
                      <span className="w-4/12">
                        <InputNumber
                          controls={false}
                          suffix="in"
                          className="w-full"
                          value={((unitItem?.width_input || 0) / 25.4).toFixed(
                            0
                          )}
                          onBlur={(e) =>
                            onChangeWidth(
                              Number(
                                (Number(e.target.value) * 25.4).toFixed(6)
                              ),
                              unitIndex
                            )
                          }
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter") {
                              onChangeWidth(
                                Number(
                                  (Number(e.target.value) * 25.4).toFixed(6)
                                ),
                                unitIndex
                              );
                            }
                          }}
                          key={`width-in-${unitItem?.width_input || 0}`}
                        />
                        {/* <InputNumber
                          style={{ marginTop: "5px" }}
                          controls={false}
                          suffix="mm"
                          className="w-full"
                          value={unitItem?.width_input?.toFixed(0)}
                          onBlur={(e) =>
                            onChangeWidth(Number(e.target.value), unitIndex)
                          }
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter") {
                              onChangeWidth(Number(e.target.value), unitIndex);
                            }
                          }}
                          key={`width-mm-${unitItem?.width_input || 0}`}
                        /> */}
                      </span>
                      <span className="w-2/12 text-gray-400 text-xs text-center">
                        Height
                      </span>
                      <span className="w-4/12">
                        <InputNumber
                          controls={false}
                          suffix="in"
                          className="w-full"
                          value={((unitItem?.height_input || 0) / 25.4).toFixed(
                            0
                          )}
                          onBlur={(e) =>
                            onChangeHeight(
                              Number(
                                (Number(e.target.value) * 25.4).toFixed(6)
                              ),
                              unitIndex
                            )
                          }
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter") {
                              onChangeHeight(
                                Number(
                                  (Number(e.target.value) * 25.4).toFixed(6)
                                ),
                                unitIndex
                              );
                            }
                          }}
                          key={`width-in-${unitItem?.height_input || 0}`}
                        />
                        {/* <InputNumber
                          style={{ marginTop: "5px" }}
                          controls={false}
                          suffix="mm"
                          className="w-full"
                          value={unitItem?.height_input?.toFixed(0)}
                          onBlur={(e) =>
                            onChangeHeight(Number(e.target.value), unitIndex)
                          }
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter") {
                              onChangeHeight(Number(e.target.value), unitIndex);
                            }
                          }}
                          key={`width-mm-${unitItem?.height_input || 0}`}
                        /> */}
                      </span>
                    </div>
                  </Col>
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <div className="flex items-center w-full">
                      <span className="w-2/12 text-gray-400 text-xs">
                        Dividers
                      </span>
                      <div className="w-10/12">
                        <Radio
                          onChange={(e: any) => {
                            onChangeDividers(
                              e.target.checked,
                              unitIndex,
                              "sdl"
                            );
                          }}
                          checked={unitItem.divider_data?.includes("sdl")}
                        >
                          SDL
                        </Radio>
                        <Radio
                          checked={unitItem.divider_data?.includes("tdl")}
                          onChange={(e: any) => {
                            onChangeDividers(
                              e.target.checked,
                              unitIndex,
                              "tdl"
                            );
                          }}
                        >
                          TDL
                        </Radio>
                        <Radio
                          checked={
                            !unitItem.divider_data?.includes("sdl") &&
                            !unitItem.divider_data?.includes("tdl")
                          }
                          onChange={(e: any) => {
                            onChangeDividers(
                              e.target.checked,
                              unitIndex,
                              "none"
                            );
                          }}
                        >
                          None
                        </Radio>
                      </div>
                    </div>
                  </Col>
                </div>
              );
            })}
          </Row>
        </div>
      </div>
      <div className={styles.right_box}>
        <Spin spinning={isUploadLoading}>
          <Dragger
            showUploadList={false}
            customRequest={handleUpload}
            style={{
              background: "#fff",
              maxHeight: "500px",
              height: "500px",
              marginTop: "85px",
            }}
          >
            <p className="ant-upload-drag-icon">
              {item.image &&
              item.image.upload_image_url &&
              uploadImageValid &&
              item.image.current_selected_mode == "upload" ? (
                <AntdImage
                  src={`${item.image.upload_image_url}?t=${Date.now()}`}
                  height={200}
                  alt="upload image"
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    width: 50,
                    height: 32,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <AntdImage
                    src="/assets/icons/upload_image.svg"
                    alt="upload image icon"
                    width={50}
                    height={32}
                    style={{ height: 32, width: 50, objectFit: "contain" }}
                    preview={false}
                  />
                </div>
              )}
            </p>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span>Drop or</span>
              <Button
                style={{ paddingLeft: "3px", paddingRight: "3px" }}
                type="link"
              >
                Choose files
              </Button>
              <span>to upload</span>
            </p>
          </Dragger>
        </Spin>
      </div>
      <style>{`
			.ant-spin-container{
				height:500px;
			}
			`}</style>
    </div>
  );
};

export default UploadItemImage;
