import {Divider, Input, message, Popconfirm, UploadFile} from "antd";
import {FilePanel} from "./Create-Takeoff/Cato-Upload";
import Image from "next/image";
import Link from "next/link";
import {useParams} from "next/navigation";
import {deleteTakeOffById} from "@/services/takeOffService";
import {http} from "@/lib/http";
import {useState} from "react";

const TakeOffCard = ({takeOff, fetchTakeOffs}: any) => {
    const order = Number(useParams().projectId);

    const {TextArea} = Input;

    const takeOffData = takeOff.take_off_result;
    const [notes, setNotes] = useState(takeOffData?.notes || "");
    async function handleDeleteTakeOff() {
        const response = await deleteTakeOffById(takeOffData?.id);
        if (response.status === "success") {
            fetchTakeOffs();
        }
    }

    let linkHref = `/projects/${order}/takeoff/${takeOffData?.id}`;
    let project_id = takeOffData?.project_id;
    if (takeOffData?.status === 1) {
        //no analysis
        linkHref += `/identification?_pId=${project_id}`;
    } else if (takeOffData?.status === 2) {
        //analysis
        linkHref += `/analyze?_pId=${project_id}`;
    }

    function sumQuantities(arr: any, propertyName: any) {
        return arr.reduce((total: any, item: any) => {
            try {
                const parsed = JSON.parse(item[propertyName]);
                const quantity = Number(parsed.Quantity) || 1;
                return total + (1 * quantity);
            } catch (e) {
                return total;
            }
        }, 0);
    }
    const handleBlur = async () => {
        updateTakeOffNotes(notes, takeOffData?.id);
    };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const updateTakeOffNotes = async (notes: string, takeOffId: number) => {
        if (!takeOffId)
            return;
        try {
            const url = `/project/take_off/edit/notes/take_off_id`;
            const body = {
                id: takeOffId,
                notes: notes,
            };
            const response = await http.put(url, body);
            return {data: response as any, status: "success"};
        } catch (error) {
            console.error("Error updating take off name:", error);
            return {data: null, status: "error"};
        }
    };

    return (
        <div
            className="flex rounded-3xl border border-neutralsN50 items-center relative text-sm gap-4 p-9 w-full justify-between hover:bg-primaryN10">
            <Link
                href={linkHref}
                className="flex flex-1 gap-4 items-center pointer-events-auto"
            >
                {takeOffData.status === 2 && (
                    <div className="absolute top-6 bg-forumBlue text-white px-3 rounded-full">
                        Analyzed
                    </div>
                )}
                <div className="flex flex-col gap-3 w-fit">
                    <p>{takeOffData?.name || "no_name"}</p>
                    <p className="text-xs text-basicGray">
        <span className="text-sm text-black">
          {getDaysSince(takeOffData?.update_time)}
        </span>{" "}
                        Last Edit | {formatDate(takeOffData?.update_time)}
                    </p>
                </div>
            </Link>

            <div className="flex border border-primaryN30 rounded-2xl text-sm text-center pointer-events-auto">
                <div className="px-4 py-3 w-20">
                    <p>{takeOffData?.items?.length || "-"}</p>
                    <p className="text-xxs text-basicGray"># Items</p>
                </div>
                <Divider type="vertical" className="m-0 h-auto bg-primaryN30"/>
                <div className="px-4 py-3 w-20">
                    <p>
                        {takeOffData?.status === 1
                            ? "-"
                            : sumQuantities(takeOffData?.items, "result")}
                    </p>
                    <p className="text-xxs text-basicGray">Products</p>
                </div>
            </div>

            <div className="flex gap-4 pointer-events-none">
                <div
                    className={`flex w-72 ${
                        takeOff?.project_files?.length > 1 ? "justify-evenly" : "justify-center"
                    } pointer-events-auto`}
                >
                    {takeOff?.project_files?.length > 0 &&
                        takeOff?.project_files?.map((data: any, index: number) => {
                            const fileUrl = data?.parse_detail?.uploaded_file_url;
                            if (!fileUrl) return null;
                            const file = createUploadFile(fileUrl, data?.file_name);
                            return (
                                <div className="bg-white h-fit" key={index}>
                                    <FilePanel file={file}/>
                                </div>
                            );
                        })}
                </div>

                <TextArea
                    className="w-72 rounded-2xl px-4 pt-2 pointer-events-auto"
                    placeholder="Personal Notes"
                    style={{resize: "none"}}
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleBlur}
                    onClick={handleClick}
                />

                <div className="flex items-center justify-center gap-2 pointer-events-auto">
                    <Popconfirm
                        title="Are you sure you want to delete this take off?"
                        onConfirm={handleDeleteTakeOff}
                        onPopupClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        <Image
                            src="/assets/icons/delete.svg"
                            alt="delete icon"
                            width={20}
                            height={20}
                            className="cursor-pointer hover:opacity-70 active:opacity-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                        />
                    </Popconfirm>
                </div>
            </div>
        </div>
    );
};

export default TakeOffCard;

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getDaysSince(dateString: string) {
    const past = new Date(dateString);
    const today = new Date();

    past.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - past.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays}d`;
}

function createUploadFile(url: string, name?: string): UploadFile {
    return {
        uid: url,
        name: name || url.split("/").pop() || "file",
        status: "done",
        url,
    };
}
