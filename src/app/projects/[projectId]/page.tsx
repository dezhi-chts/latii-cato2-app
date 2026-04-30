"use client";
import Image from "next/image";
import Header from "./components/Header";
import { Input, Spin, Modal } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import EmptyProject from "./components/Empty-Project";
import { useEffect, useRef, useState } from "react";

import CreateTakeOffModal from "./components/Create-Takeoff/Create-Takeoff-Modal";
import {
	getTakeOffsByProjectId,
	deleteTakeOffById,
	getMergeStatusByTakeOffId,
	updateTakeOffInfo,
} from "@/services/takeOffService";
import { useParams, useRouter } from "next/navigation";
import UploadFilesProgress from "./components/Upload-Files-Progress";
import PdfParseModal from "./components/Pdf-Parse-Modal";
import { fetchProject } from "@/services/projectService";
import Button from "@/components/Button";
import { formatDateLong, getDaysAgoLabel } from "@/lib/functions";
import Link from "next/link";
import { TakeOffFileStatus } from "@/types/home";

const { confirm } = Modal;

const Project = () => {
	const router = useRouter();
	const projectId = useParams().projectId;
	const [project, setProject] = useState<any>(null);
	const [filter, setFilter] = useState<string>("");
	const [showCreateTakeOffModal, setShowCreateTakeOffModal] = useState(false);
	const [takeoffsList, setTakeoffsList] = useState<any[]>([]);
	const [fullLoading, setFullLoading] = useState(false);
	const [showUploadProgess, setShowUploadProgess] = useState(false);
	const [showPdfParseModal, setShowPdfParseModal] = useState(false);
	const [selectedType, setSelectedType] = useState(["All"]);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingTakeoff, setEditingTakeoff] = useState<any>(null);
	const [editingTakeoffName, setEditingTakeoffName] = useState("");
	const [editSubmitting, setEditSubmitting] = useState(false);

	const uploadFiles = useRef<any>(null);
	const projectInfo = useRef<any>(null);

	useEffect(() => {
		getProjectTakeoffs();
		getProject();
	}, [projectId]);

	const createQuotiiButton = (
		<Button
			backgroundColor="forumBlue-normal"
			className="rounded-md"
			onClick={() => setShowCreateTakeOffModal(true)}
		>
			Create Take Off
		</Button>
	);

	const getProject = async () => {
		let res = await fetchProject(projectId as string);
		if (res.status === "success") {
			setProject(res.data ?? null);
		} else {
			setProject(null);
		}
	};

	const changeType = (type: string) => {
		setSelectedType((prev) => {
			if (type === "All") return ["All"];

			const next = prev.includes("All") ? [] : [...prev];

			const idx = next.indexOf(type);
			if (idx >= 0) {
				next.splice(idx, 1);
				return next.length ? next : ["All"];
			}

			next.push(type);
			return next;
		});
	};

	const getProjectTakeoffs = async () => {
		setFullLoading(true);
		let res = await getTakeOffsByProjectId(projectId as string);
		setFullLoading(false);
		if (res.status === "success") {
			setTakeoffsList(res.data ?? []);
		} else {
			setTakeoffsList([]);
		}
	};

	const handleUploadFiles = async (data: {
		archFiles: UploadFile[];
		quoteFiles: UploadFile[];
	}) => {
		console.log("######### handleUploadFiles", data);
		//打开Create-Project-Takeoff-Modal弹窗
		uploadFiles.current = data;
		// 打开Upload-Files-Progress弹窗
		setShowUploadProgess(true);
	};

	const handleRemoveTakeoff = async (takeoff: any) => {
		confirm({
			title: `Are you sure to delete this takeoff: ${takeoff?.name}?`,
			okText: "Yes",
			onOk: async () => {
				setFullLoading(true);
				const res = await deleteTakeOffById(takeoff?.id as string);
				setFullLoading(false);
				getProjectTakeoffs();
			},
		});
	};

	const handleOpenEditTakeoff = (takeoff: any) => {
		setEditingTakeoff(takeoff);
		setEditingTakeoffName(String(takeoff?.name || "").trim());
		setEditModalOpen(true);
	};

	const handleCloseEditTakeoff = () => {
		if (editSubmitting) return;
		setEditModalOpen(false);
		setEditingTakeoff(null);
		setEditingTakeoffName("");
	};

	const handleSaveEditTakeoff = async () => {
		if (!editingTakeoff?.id) return;
		const nextName = editingTakeoffName.trim();
		if (!nextName) {
			Modal.error({
				title: "Error",
				content: "Take Off Name cannot be empty.",
			});
			return;
		}
		setEditSubmitting(true);
		const response = await updateTakeOffInfo(Number(editingTakeoff.id), {
			name: nextName,
		});
		setEditSubmitting(false);
		if (response.status !== "success") {
			Modal.error({
				title: "Error",
				content: response?.data?.detail || "Failed to update takeoff info.",
			});
			return;
		}
		setEditModalOpen(false);
		setEditingTakeoff(null);
		setEditingTakeoffName("");
		await getProjectTakeoffs();
	};

	const filterTypeList = [
		{
			type: "All",
			bgColor: "bg-primaryN30 hover:bg-primaryN50",
			iconBgColor: "bg-primaryN70",
			icontextColor: "text-white",
		},
		{
			type: "Upload",
			bgColor: "bg-[#FF931E2B] hover:bg-[#FF931E4B]",
			iconBgColor: "bg-white",
			icontextColor: "text-dragonOrange",
		},
		{
			type: "Takeoff",
			bgColor: "bg-[#008ECE2B] hover:bg-[#008ECE4B]",
			iconBgColor: "bg-white",
			icontextColor: "text-kahuBlue",
		},
	];

	const handleLocation = async (record: any) => {
		console.log("######## takeoff detail", record);
		let floorPlanUrl = `/projects/${record.project_id}/takeoff/${record.id}/merge-before/floor-plan`;
		let scheduleUrl = `/projects/${record.project_id}/takeoff/${record.id}/merge-before/schedule`;
		let manualMergeUrl = `/projects/${record.project_id}/takeoff/${record.id}/manual-merge-v3`;
		let analyzeUrl = `/projects/${record.project_id}/takeoff/${record.id}/analyze-new`;
		let identificationUrl = `/projects/${record.project_id}/takeoff/${record.id}/identification`;

		setFullLoading(true);
		// 获取takeoff文件状态
		const mergeResult: any = await getMergeStatusByTakeOffId(record.id as any);

		if (mergeResult.status === "success") {
			if (mergeResult.data.take_off_completed) {
				// 已合并完成，跳转到
				router.push(analyzeUrl);
			} else {
				const labelList = Object.values(mergeResult.data?.files || {});
				if (!labelList || labelList.length === 0) return;

				let firstFile = labelList[0];
				switch (firstFile?.status) {
					case TakeOffFileStatus.STATUS_UNPROCESSED:
						router.push(identificationUrl);
						break;
					case TakeOffFileStatus.STATUS_ELEVATION_FLOOR_REVIEWING:
						router.push(floorPlanUrl);
						break;
					case TakeOffFileStatus.STATUS_ELEVATION_FLOOR_REVIEWED:
					case TakeOffFileStatus.STATUS_SCHEDULE_REVIEWING:
						router.push(scheduleUrl);
						break;
					case TakeOffFileStatus.STATUS_SCHEDULE_REVIEWED:
					case TakeOffFileStatus.STATUS_MERGING:
						router.push(manualMergeUrl);
						break;
					case TakeOffFileStatus.STATUS_MERGED:
						router.push(analyzeUrl);
						break;
					default:
						setFullLoading(false);
						break;
				}
			}
		} else {
			setFullLoading(false);
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-12 zoomed-container font-nunito">
				<Header project={project} refetchProject={getProject} />
				<div className="flex flex-col gap-8 mt-44 pl-20 ">
					<div className="flex text-lg text-forumBlue-normal">Takeoffs</div>
					{takeoffsList?.length > 0 && (
						<div className="flex justify-between items-center w-11/12">
							<div className="flex h-[34px] flex-row gap-5 items-center">
								<Input
									className="w-[400px] h-full rounded-xl"
									placeholder="Project Name, Status, Client and More."
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
								{filterTypeList.map((item) => {
									const isActive = selectedType.includes(item.type);
									const dynamicStyles = `${isActive ? "border-forumBlue-normal" : "border-transparent"} ${item.bgColor}`;
									return (
										<div
											key={item.type}
											className={`${dynamicStyles} px-4 h-[26px] text-center rounded-md border gap-2 flex justify-center items-center text-xs cursor-pointer`}
											onClick={() => changeType(item.type)}
										>
											<p className="pt-0.5">{item.type}</p>
											<p
												className={`px-1.5 pt-0.5 text-xs ${item.icontextColor} ${item.iconBgColor} rounded`}
											>
												1
											</p>
										</div>
									);
								})}
							</div>
							{createQuotiiButton}
						</div>
					)}

					<div className="w-11/12 flex flex-col gap-4 pb-10 overflow-auto pt-4 h-[80vh] scrollbar-hidden">
						{false ? (
							<Spin />
						) : takeoffsList?.length > 0 ? (
							takeoffsList.map((takeOff: any, index: number) => {
								const name = takeOff?.take_off_result?.name || "";
								if (!name.toLowerCase().includes(filter.toLowerCase()))
									return null;

								return (
									<div
										key={index}
										onClick={() => handleLocation(takeOff.take_off_result)}
									>
										<div className="p-5 h-[140px] flex flex-row rounded-2xl border border-primaryN30 cursor-pointer hover:bg-primaryN10 transition-all duration-150">
											<div>
												<Image
													src="/assets/cato-images/schedules-tables.png"
													alt="info icon"
													width={156}
													height={100}
												/>
											</div>
											<div className="ml-[50px] flex-1 flex flex-col gap-2">
												<div className="text-base">
													{takeOff?.take_off_result?.name || ""}
												</div>
												<div className="w-[100px] h-[26px] bg-[#008ECE4C] rounded-xl text-center font-light text-sm flex items-center justify-center">
													{takeOff?.take_off_result?.status === 2
														? "Analyzed"
														: "Uploaded"}
												</div>

												<div className="text-xs text-grey-normal">
													<p>
														<span className="font-bold text-black">
															{getDaysAgoLabel(
																takeOff?.take_off_result?.update_time || "",
															)}{" "}
														</span>
														Last edit |{" "}
														{formatDateLong(
															takeOff?.take_off_result?.update_time || "",
														)}
													</p>
												</div>
											</div>
											<div
												className="flex justify-center items-center cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													handleOpenEditTakeoff(takeOff.take_off_result);
												}}
											>
												<EditOutlined className="text-[15px] text-grey-light-strong" />
											</div>
											<div
												className="ml-3 flex justify-center items-center cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveTakeoff(takeOff.take_off_result);
												}}
											>
												<Image
													src="/assets/icons/delete.svg"
													alt="Delete"
													width={20}
													height={20}
												/>
											</div>
										</div>
									</div>
								);
							})
						) : (
							<EmptyProject createQuotiiButton={createQuotiiButton} />
						)}
					</div>
				</div>
			</div>
			{showCreateTakeOffModal && (
				<CreateTakeOffModal
					isOpen={showCreateTakeOffModal}
					setIsOpen={setShowCreateTakeOffModal}
					onHandleUpload={handleUploadFiles}
				/>
			)}
			{showUploadProgess && (
				<UploadFilesProgress
					isOpen={showUploadProgess}
					closeModal={() => setShowUploadProgess(false)}
					uploadFilesData={uploadFiles.current}
					syncCreateProject={false}
					onSuccess={(data: any) => {
						// 关闭Upload-Files-Progress弹窗
						setShowUploadProgess(false);
						projectInfo.current = data;
						// 打开文件解析弹窗
						setShowPdfParseModal(true);
						// 刷新takeoffsList
						getProjectTakeoffs();
					}}
				/>
			)}
			{showPdfParseModal && (
				<PdfParseModal
					isOpen={showPdfParseModal}
					closeModal={() => setShowPdfParseModal(false)}
					data={projectInfo.current}
					handleNext={(type: "takeoffModal" | "pageIndex") => {
						// 跳转到Page-Index页面
						//router.push(`/projects/38/takeoff/15/identification`);
						router.push(
							`/projects/${projectId}/takeoff/${projectInfo.current?.take_off_id}/identification`,
						);
					}}
					handleCancel={() => {
						// 关闭Pdf-Parse-Modal弹窗
						setShowPdfParseModal(false);
					}}
				/>
			)}
			{fullLoading && <Spin fullscreen />}
			<Modal
				open={editModalOpen}
				title="Edit Take Off"
				okText="Save"
				cancelText="Cancel"
				onCancel={handleCloseEditTakeoff}
				onOk={handleSaveEditTakeoff}
				confirmLoading={editSubmitting}
			>
				<div className="text-xs text-grey-normal mb-2">Take Off Name</div>
				<Input
					value={editingTakeoffName}
					onChange={(e) => setEditingTakeoffName(e.target.value)}
					placeholder="Enter take off name"
					maxLength={120}
				/>
			</Modal>
			{/* {loadingCato && (
        <BuildingBackground
          isDone={isCreateTakeOffDone}
          onFinish={() => {
            if (!redirectUrl) return;
            router.push(redirectUrl);
          }}
        />
      )} */}
		</div>
	);
};

export default Project;
