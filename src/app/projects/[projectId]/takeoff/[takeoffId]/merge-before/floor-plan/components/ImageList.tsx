"use client";

import { useEffect, useState } from "react";
import { Image, Spin, Empty } from "antd";
import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";

interface EvidenceImage {
	id: number;
	evidence_url: string;
}

interface ImageListProps {
	imagesData: EvidenceImage[];
	showPreview?: boolean;
}

export default function ImageList({
	imagesData,
	showPreview = true
}:
	ImageListProps
) {
	const [images, setImages] = useState<EvidenceImage[]>([]);

	useEffect(() => {
		setImages(imagesData);
	}, [imagesData]);

	return (
		<div className="mb-2 flex h-full min-h-0 flex-col">
			<div className="mb-2 text-sm font-medium text-forumBlue-normal">
				Schedule Images ({images.length})
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto pr-1">
				<div className="grid grid-cols-2 gap-4">
					{images.map((image: any) => {
						let label = "";
						if (image?.label_list instanceof Array && image.label_list.length > 0) {
							label = image.label_list.join(",");
						}
						return <div
							key={image.id}
							className="relative aspect-square rounded-md overflow-hidden border border-primaryN30"
						>
							<div className="px-2 py-1 bg-primaryN20 text-primaryN90 rounded-md z-30">
								{label}
							</div>
							<Image
								src={image.evidence_url || ""}
								alt={"Evidence"}
								className="object-contain"
								preview={showPreview}
							/>
						</div>
					})}
				</div>
			</div>
		</div>
	);
}
