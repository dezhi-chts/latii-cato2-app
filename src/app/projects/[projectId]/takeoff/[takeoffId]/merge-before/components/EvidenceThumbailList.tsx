import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { notification, Select, Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { allPageTypes, PageType } from "../../types/evidence";
const LazyImage = ({
	src,
	alt,
	size, // 缩略图大小
	onError,
}: {
	src: string;
	alt: string;
	size: "default" | "larger"; // 缩略图大小
	onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) => {
	const imgRef = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (!imgRef.current) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && imgRef.current) {
					imgRef.current.src = src;
					setLoaded(true);

					observer.disconnect();
				}
			},
			{
				rootMargin: "100px",
				threshold: 0.01,
			},
		);

		observer.observe(imgRef.current);

		return () => {
			if (imgRef.current) {
				observer.unobserve(imgRef.current);
			}
		};
	}, [src]);

	return (
		<div
			className="w-full relative overflow-hidden"
			style={{
				height: size === "default" ? "100px" : "160px",
			}}
		>
			{!loaded && (
				<div className="absolute inset-0 w-[100%] h-[100%] bg-gray-300 animate-pulse"></div>
			)}
			<img
				ref={imgRef}
				alt={alt}
				className={`w-full h-full object-top transition-opacity duration-300 ${
					loaded ? "opacity-100" : "opacity-0"
				}`}
				onError={onError}
				loading="lazy"
			/>
		</div>
	);
};

interface EvidenceThumbailListProps {
	pdfRef?: any; // pdf 实例
	data: {
		// 缩略图数据列表
		id: number;
		project_file_page_number: number; // 页面编号
		evidence_url: string; // 证据url
		type: string; // 类型
	}[];
	evidenceId: number; // 当前选中的页面
	onChangeEvidenceId: (evidenceId: number) => void;
	fixed?: boolean; // 是否固定位置
	showCategory?: boolean; // 是否显示分类
	showShadow?: boolean; // 是否显示阴影
	size?: "default" | "larger"; // 缩略图大小
	categoryList?: { type: string; color: string; icon: string }[]; // 页面分类
}

const EvidenceThumbailList = ({
	pdfRef,
	data,
	evidenceId,
	onChangeEvidenceId,
	fixed = false, // 是否固定位置
	showCategory = false, // 是否显示分类
	size = "default", // 缩略图大小
	categoryList = [], // 页面分类
}: EvidenceThumbailListProps) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let id = `thumbnail-evidence-${evidenceId}`;
		const targetThumbnail = document.getElementById(id);
		if (!targetThumbnail) return;
		if (targetThumbnail && scrollContainerRef.current) {
			// 计算滚动容器的当前滚动位置和高度
			const scrollTop = scrollContainerRef.current.scrollTop;
			const containerHeight = scrollContainerRef.current.clientHeight;

			// 计算目标缩略图在滚动容器内的位置
			const targetTop = targetThumbnail.offsetTop;
			const targetBottom = targetTop + targetThumbnail.clientHeight;

			// 判断目标是否在滚动容器的可视区域内
			// 可视区域的范围是 [scrollTop, scrollTop + containerHeight]
			const isInViewport =
				targetTop >= scrollTop && targetBottom <= scrollTop + containerHeight;

			// 如果目标不在可视区域内，则执行滚动
			if (!isInViewport) {
				scrollContainerRef.current.scrollTo({
					top: targetThumbnail.offsetTop - 50,
					behavior: "smooth",
				});
			}
		}
	}, [evidenceId]);

	const onClickEvidenceId = async (evidenceId: number) => {
		let unSaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
		if (!pdfRef?.current || unSaved) {
			onChangeEvidenceId(evidenceId);
		}
	};

	const getItemPage = (item: any, index: number) => {
		if (typeof item.file_name === "string") {
			let pageArr = item.file_name?.split(".")[0];
			return parseInt(pageArr) + 1;
		}
		return index + 1;
	};

	const pageTypeInfo = (info: any) => {
		let category = categoryList.find((item) => {
			return item.type === info.type;
		});
		if (!category) return {};
		return category || {};
	};

	return (
		<div
			className={`${fixed ? "absolute" : ""} top-0 right-0 transition-all duration-200 bg-white z-9999`}
			style={{
				width: "250px",
				height: "100%",
			}}
		>
			<div
				className={`w-full h-full py-2 overflow-y-auto relative`}
				ref={scrollContainerRef}
			>
				<div className="flex flex-col gap-4 min-h-full items-center">
					{data?.length > 0 &&
						data.map((info, index) => {
							let itemPageNum = getItemPage(info, index);
							let {
								color = allPageTypes[PageType.NotUsed].color,
								icon = allPageTypes[PageType.NotUsed].icon,
							} = pageTypeInfo(info);
							return (
								<div
									id={`thumbnail-evidence-${info.id}`}
									key={info.id}
									className={`w-[170px] rounded-md bg-primaryN20 shadow-md cursor-pointer border-[2px] ${
										info.id === evidenceId
											? "border-forumBlue-normal"
											: "border-transparent hover:border-forumBlue-normal/50"
									}`}
									style={{
										height: size === "default" ? "150px" : "220px",
									}}
									onClick={() => onClickEvidenceId(info.id)}
								>
									<div className="p-[10px]">
										<div className="h-[30px] flex flex-row justify-between">
											<p className="mb-3 text-xxs text-grey-normal">
												{itemPageNum}
											</p>
											{showCategory && (
												<div
													className="w-[30px] h-[18px] flex items-center justify-center rounded text-xxs text-white"
													style={{ backgroundColor: color }}
												>
													<span>{icon}</span>
												</div>
											)}
										</div>
										<div>
											<LazyImage
												src={info.evidence_url || ""}
												alt={"Evidence"}
												size={size}
												onError={(e) => {
													e.currentTarget.src =
														"/assets/placeholder-images/example_1.png";
												}}
											/>
										</div>
									</div>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};

export default EvidenceThumbailList;
