"use client";

import { useEffect, useState } from "react";
import ImagePreviewWithExpand from "../../../components/ImagePreviewWithExpand";

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
				Schedule Source ({images.length})
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
							className="relative flex aspect-square flex-col overflow-hidden rounded-md border border-primaryN30 bg-white"
						>
							<div className="z-30 rounded-md bg-primaryN20 px-2 py-1 text-primaryN90">
								{label}
							</div>
							<div className="min-h-0 flex-1 p-2">
								<ImagePreviewWithExpand
									src={image.evidence_url || ""}
								/>
							</div>
						</div>
					})}
				</div>
			</div>
		</div>
	);
}
