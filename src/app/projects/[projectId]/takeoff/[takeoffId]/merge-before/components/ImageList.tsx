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
}

export default function ImageList({ imagesData }: ImageListProps) {
	const [images, setImages] = useState<EvidenceImage[]>([]);

	useEffect(() => {
		setImages(imagesData);
	}, [imagesData]);

	return (
		<div className="mb-2 flex h-full min-h-0 flex-col">
			<div className="mb-2 text-sm font-medium text-forumBlue-normal">
				Evidence Images
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto pr-1">
				<div className="grid grid-cols-1 gap-2">
					{images.map((image) => (
						<div
							key={image.id}
							className="relative aspect-square rounded-md overflow-hidden border border-primaryN30"
						>
							<Image
								src={image.evidence_url || ""}
								alt={"Evidence"}
								className="object-cover"
								preview={true}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
