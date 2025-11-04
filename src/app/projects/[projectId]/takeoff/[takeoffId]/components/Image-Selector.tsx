import { Image as AndImage, Modal, Spin, Badge, Dropdown, Button, Popconfirm } from "antd";
import {useEffect, useRef, useState, useCallback} from "react";
import NewDrawing from "./new-drawing/new-drawing";
import NewDrawingSystem from "./new-drawing-system/new-drawing-system"
import UploadItemImage from "./upload-item-image/upload-item-image"
import { PlusOutlined, DeleteOutlined, EyeOutlined,ExclamationCircleFilled } from "@ant-design/icons";
import type { MenuProps } from 'antd';
import { tr } from "framer-motion/m";
import http from "@/lib/http";
const { confirm } = Modal;

interface IImageSelectorProps {
  item:any;
  quoteTypeOfDataSource:number;
  onValueChange: (value:any) => void;
  handleImageCurrentSelectedMode: (value:any) => void;
}

const ImageSelector = ({ item, quoteTypeOfDataSource, onValueChange, handleImageCurrentSelectedMode }:IImageSelectorProps) => {

  const [isOpenNewDrawingBox, setIsOpenNewDrawingBox] = useState(false);
  const [imageValid, setImageValid] = useState(false);
  const [uploadImageValid, setUploadImageValid] = useState(false);
  const [extractImageValid, setExtractImageValid] = useState(false);
  const [isLoading, setIsLoading] = useState<any>(false);
  const [isOpenUploadBox, setIsOpenUploadBox] = useState(false);
 
  const [isLoadingImageBox, setIsLoadingImageBox] = useState(false);

  const [drawingItems, setDrawingItems] = useState([
    {
      key: "system",
      label: <span>System</span>,
    },
    {
      key: "window_door",
      label: <span>Window / Door</span>
    }
  ]);
  const [drawingUseItem, setDrawingUseItem] = useState<any>({});

  const handleUploadClick = () => {
    if (item.image && item.image.upload_image_url && uploadImageValid){
      if (item.image.current_selected_mode!="upload"){
        item.image.current_selected_mode = "upload"
        handleImageCurrentSelectedMode(item)
        return
      }
    }
    setIsOpenUploadBox(true);
  }

  const checkImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleExtractClick = () => {
    if (item.image && item.image.extract_image_url && extractImageValid){
      if (item.image.current_selected_mode!="extract"){
        item.image.current_selected_mode = "extract"
        handleImageCurrentSelectedMode(item)
        return
      }
    }
  };

  const handleDrawClick = () => {
    if (item.image && item.image.drawing_image_url && imageValid){
      if (item.image.current_selected_mode!="drawing"){
        item.image.current_selected_mode = "drawing"
        handleImageCurrentSelectedMode(item)
        return
      }
    }
    let drawingUseItem = JSON.parse(JSON.stringify(item))
    drawingUseItem.item_type.selected_value = "99"
    drawingUseItem.is_system = true
    setDrawingUseItem({...drawingUseItem})
    setIsOpenNewDrawingBox(true);
  }

  const handleUpdateQuote = (e:any) => {
    onValueChange(e)
  }

  useEffect(() => {
    // setIsLoadingImageBox(true)
    // setImageValid(false);
    if (item?.image?.drawing_image_url) {
      checkImageUrl(item.image.drawing_image_url)
        .then(valid => {
          setImageValid(valid);
        })
    } else {
      setImageValid(false);
    }

    // setUploadImageValid(false)
    if (item?.image?.upload_image_url) {
      checkImageUrl(item.image.upload_image_url)
        .then(valid => {
          setUploadImageValid(valid);
        })
    } else {
      setUploadImageValid(false);
    }

    if (item?.image?.extract_image_url) {
      checkImageUrl(item.image.extract_image_url)
        .then(valid => {
          setExtractImageValid(valid);
        })
    } else {
      setExtractImageValid(false);
    }

    
    // setTimeout(()=>{
    //   setIsLoadingImageBox(false)
    // }, 500)
  }, [item.image]);

  const closeNewDrawingBoxHandle = () => {
    confirm({
      title: 'Are you sure you want to close without saving',
      icon: <ExclamationCircleFilled />,
      content: 'Any unsaved information will be lost',
      okText: 'Close',
      cancelText: 'Cancel',
      className:"close_new_drawing_model",
      onOk() {
        setIsOpenNewDrawingBox(false)
      },
      onCancel() {
        console.log('Cancel');
      },
    })
  };

  const closeUploadBoxHandle = () => {
    confirm({
      title: 'Are you sure you want to close without saving',
      icon: <ExclamationCircleFilled />,
      content: 'Any unsaved information will be lost',
      okText: 'Close',
      cancelText: 'Cancel',
      className:"close_new_drawing_model",
      onOk() {
        setIsOpenUploadBox(false)
      },
      onCancel() {
        console.log('Cancel');
      },
    })
  };

  const onHandleDrawingItem = (e:any) => {
    let drawingUseItem = JSON.parse(JSON.stringify(item))
    if(e.key == "system"){
      drawingUseItem.item_type.selected_value = "99"
      drawingUseItem.is_system = true
    }else{
      drawingUseItem.item_type.selected_value = drawingUseItem.units[0].product.selected_value
      drawingUseItem.units = [drawingUseItem.units[0]]
      drawingUseItem.is_system = false
    }
    setDrawingUseItem({...drawingUseItem})
    setIsOpenNewDrawingBox(true);
    
  };

  const onDeleteItemImage = (type:string) => {
    const itemId = item.id
    http
    .delete(`/quote/delete_quote_image/${itemId}/type/${type}`)
    .then(() => {
      item.image.current_selected_mode = ""
      if (imageValid){
        item.image.current_selected_mode = "drawing"   
      }
      handleImageCurrentSelectedMode(item)
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  }

  return (
    <Spin spinning={isLoading}>
      {
        item.frame_material?.selected_value && 
        <div style={{flexDirection:"column"}} className="w-full h-80 rounded-xl border border-dashed border-primaryN50 flex items-center justify-center gap-2 text-xs relative">
          {
            item.image && item.image.upload_image_url && uploadImageValid && item.image.current_selected_mode=="upload" &&
             <Popconfirm
              title="Delete the image"
              description="Are you sure to delete this image?"
              onConfirm={()=>onDeleteItemImage("upload")}
              onCancel={()=>{}}
              okText="Yes"
              cancelText="No"
            >
              <DeleteOutlined 
                className="absolute left-3 top-3 text-lg cursor-pointer text-gray-500"
              />
            </Popconfirm>
          }
          <Spin spinning={isLoadingImageBox}>
            <div 
              style={{
                height:"220px",
                width:"90%",
                marginLeft:"auto", 
                marginRight:"auto",
                maxHeight: 220, 
                maxWidth:"90%",
                display:"flex",
                alignItems:"center",
                justifyContent:"center"
              }}
            >
              {
                item.image && item.image.drawing_image_url && imageValid && item.image.current_selected_mode=="drawing" && (
                  <AndImage
                    width={"100%"}
                    style={{ 
                      maxHeight: 220, 
                      maxWidth:"100%",
                      width:"auth",
                      height:"auto",
                      objectFit: "contain" 
                    }}
                    src={`${item.image.drawing_image_url}?t=${Date.now()}`}
                  />
                ) 
              }

              {
                item.image && item.image.upload_image_url && uploadImageValid && item.image.current_selected_mode=="upload" && (
                  <AndImage
                    width={"100%"}
                    style={{ 
                      maxHeight: 220, 
                      maxWidth:"100%",
                      width:"auth",
                      height:"auto",
                      objectFit: "contain" 
                    }}
                    src={`${item.image.upload_image_url}?t=${Date.now()}`}
                  />
                ) 
              }
              {
                item.image && item.image.extract_image_url && extractImageValid && item.image.current_selected_mode=="extract" && (
                  <AndImage
                    width={"100%"}
                    style={{ 
                      maxHeight: 220, 
                      maxWidth:"100%",
                      width:"auth",
                      height:"auto",
                      objectFit: "contain" 
                    }}
                    src={`${item.image.extract_image_url}?t=${Date.now()}`}
                  />
                ) 
              }
            </div>
          </Spin>
          <div style={{display:"flex", justifyContent:"center"}}>
            <div className="flex flex-col items-center gap-1 group cursor-pointer">
              
              {/* <Dropdown menu={{ items: drawingItems, onClick: onHandleDrawingItem }} placement="top"> */}
              <div 
                style={{
                  position:"relative",
                  marginTop:"5px",
                  background:`${item.image && item.image.drawing_image_url && imageValid && item.image.current_selected_mode=="drawing" ?"#014768": "#f5f6f7"}`,
                }}
                onClick={handleDrawClick}
                className="rounded-2xl bg-primaryN20 py-2 px-3.5 flex items-center justify-center group-hover:bg-primaryN30"
              >
                <div
                  style={{
                    color: `${item.image && item.image.drawing_image_url && imageValid && item.image.current_selected_mode=="drawing" ?"#ffffff": "#014768"}`
                  }}
                >
                  <svg
                    width="20"
                    height="12"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.76721 12.3184L11.9999 5.0857C12.1808 4.90479 12.3243 4.69001 12.4222 4.45363C12.5201 4.21726 12.5705 3.96391 12.5705 3.70806C12.5705 3.4522 12.5201 3.19885 12.4222 2.96248C12.3243 2.7261 12.1808 2.51132 11.9999 2.33041C11.8189 2.14949 11.6042 2.00598 11.3678 1.90807C11.1314 1.81016 10.8781 1.75977 10.6222 1.75977C10.3664 1.75977 10.113 1.81016 9.87664 1.90807C9.64026 2.00598 9.42548 2.14949 9.24457 2.33041L2.01191 9.56306V12.3184H4.76721Z"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.05097 2.93359L11.3973 5.27995"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.8107 11.1458H13.1571M11.9839 9.97266V12.319"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {
                  item.image && item.image.drawing_image_url && imageValid && <Badge
                    dot
                    color="#2A845A"
                    style={{position:"absolute",right:"0px",top:"-5px"}}
                  />
                }
              </div>
              {/* </Dropdown> */}
              <p className="text-basicGray">Draw</p>
            </div>
            <div style={{marginLeft:"10px"}} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div 
                onClick={() => handleUploadClick()} 
                style={{
                  position:"relative",
                  marginTop:"5px",
                  background:`${item.image && item.image.upload_image_url && uploadImageValid && item.image.current_selected_mode=="upload" ?"#014768": "#f5f6f7"}`,
                }}
                className="rounded-2xl bg-primaryN20 py-2 px-3.5 flex items-center justify-center group-hover:bg-primaryN30"
              >
                <div
                  style={{
                    color: `${item.image && item.image.upload_image_url && uploadImageValid && item.image.current_selected_mode=="upload" ?"#ffffff": "#014768"}`
                  }}
                >
                  <svg width="20" height="12" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.25208 11.3848L3.25478 12.7181C3.25549 13.0717 3.39665 13.4106 3.6472 13.6601C3.89776 13.9097 4.23718 14.0494 4.5908 14.0487L12.5908 14.0326C12.9444 14.0319 13.2833 13.8907 13.5328 13.6401C13.7823 13.3896 13.9221 13.0502 13.9214 12.6965L13.9187 11.3632" 
                      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.2413 6.04817L8.56789 2.70811L11.908 6.0347" 
                      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.56789 2.70703L8.58406 10.707" 
                      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {
                  item.image && item.image.upload_image_url && uploadImageValid && <Badge
                    dot
                    color="#2A845A"
                    style={{position:"absolute",right:"0px",top:"-5px"}}
                  />
                }
              </div>
              <p className="text-basicGray">Upload</p>
            </div>
            {
              quoteTypeOfDataSource == 1 &&
              <div style={{marginLeft:"10px"}} className="flex flex-col items-center gap-1 group cursor-pointer">
                <div 
                  onClick={() => handleExtractClick()} 
                  style={{
                    position:"relative",
                    marginTop:"5px",
                    background:`${item.image && item.image.extract_image_url && extractImageValid && item.image.current_selected_mode=="extract" ?"#014768": "#f5f6f7"}`,
                  }}
                  className="rounded-2xl bg-primaryN20 py-2 px-3.5 flex items-center justify-center group-hover:bg-primaryN30"
                >
                  <div
                    style={{
                      color: `${item.image && item.image.extract_image_url && extractImageValid && item.image.current_selected_mode=="extract" ?"#ffffff": "#014768"}`
                    }}
                  >
                    <svg width="16" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 4.5C3 4.10218 3.15804 3.72064 3.43934 3.43934C3.72064 3.15804 4.10218 3 4.5 3H13.5C13.8978 3 14.2794 3.15804 14.5607 3.43934C14.842 3.72064 15 4.10218 15 4.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H4.5C4.10218 15 3.72064 14.842 3.43934 14.5607C3.15804 14.2794 3 13.8978 3 13.5V4.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 12H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 8.99987L5.25 6.74987C5.946 6.08012 6.804 6.08012 7.5 6.74987L10.5 9.74987" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.75 8.99987L11.25 7.49987C11.946 6.83012 12.804 6.83012 13.5 7.49987L15 8.99987" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.5 5.25H10.5075" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {
                    item.image && item.image.extract_image_url && extractImageValid && <Badge
                      dot
                      color="#2A845A"
                      style={{position:"absolute",right:"0px",top:"-5px"}}
                    />
                  }
                </div>
                <p className="text-basicGray">Extract</p>
              </div>
            }
          </div>

          <Modal
            open={isOpenNewDrawingBox}
            footer={null}
            onCancel={closeNewDrawingBoxHandle}
            width={"90%"}
            destroyOnHidden={true}
            keyboard={false}
            maskClosable={false}
            afterClose={() => setIsOpenNewDrawingBox(false)}
            style={{top:"2vh"}}
          >
            {
              (isOpenNewDrawingBox && !drawingUseItem.is_system) &&
                <NewDrawing
                  currentItem={JSON.parse(JSON.stringify(drawingUseItem))}
                  handleUpdateQuote={handleUpdateQuote}
                  setIsOpenNewDrawingBox={setIsOpenNewDrawingBox}
                  from="itemCard"
                >
                </NewDrawing>
            }

            {
              (isOpenNewDrawingBox && drawingUseItem.is_system) && <NewDrawingSystem
                currentItem={JSON.parse(JSON.stringify(drawingUseItem))}
                handleUpdateQuote={handleUpdateQuote}
                setIsOpenNewDrawingBox={setIsOpenNewDrawingBox}
              >
              </NewDrawingSystem>
            }
          </Modal>
          
          <Modal
            open={isOpenUploadBox}
            footer={null}
            onCancel={() => setIsOpenUploadBox(false)}
            width={"800px"}
            destroyOnHidden={true}
            keyboard={false}
            maskClosable={false}
            afterClose={() => setIsOpenUploadBox(false)}
          >
            {
              isOpenUploadBox &&
                <UploadItemImage
                    currentItem={JSON.parse(JSON.stringify(item))}
                    handleUpdateQuote={handleUpdateQuote}
                    setIsOpenUploadBox={setIsOpenUploadBox}
                    from="itemCard"
                >
                </UploadItemImage>
            }
          </Modal>
          
          <style>{`
            .close_new_drawing_model .ant-btn-variant-solid{
              background:#FF931E!important;
            }
          `}</style>
        </div>
      }
      {
        !item.frame_material?.selected_value &&
        <div 
          style={{
            fontSize:"13px",
            display:"flex",
            textAlign:"center",
            color: "#717171"
          }}
          className="w-full h-80 rounded-xl border border-dashed border-primaryN50 flex items-center justify-center gap-2 text-xs"
        >
          Select Bellavista or Spazio to start customizing your item.
        </div>
      }
    </Spin>
  );
};

export default ImageSelector;
