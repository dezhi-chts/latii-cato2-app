import Image from "next/image";
import { useEffect, useState } from "react";
import { Progress } from "antd";

const DEFAULT_DURATION_SECONDS = 180; // Default 3 minutes

const CircleProgress = ({
	size = 78,
	durationSeconds = DEFAULT_DURATION_SECONDS,
}: {
	size?: number;
	durationSeconds?: number;
}) => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (durationSeconds <= 0) return;

		const intervalMs = (durationSeconds * 1000) / 100;
		let interval: NodeJS.Timeout;

		const startProgress = () => {
			interval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) {
						clearInterval(interval);
						return 90;
					}
					return prev + 1;
				});
			}, intervalMs);
		};

		startProgress();

		return () => clearInterval(interval);
	}, [durationSeconds]);

	return (
		<div>
			<Progress
				type="circle"
				percent={progress}
				showInfo={false}
				size={size}
				strokeWidth={4}
				strokeColor="#427CCE"
				trailColor="#ECF2FA"
			/>
		</div>
	);
};

const InActiveCircle = () => {
	return (
		<div className="w-[16px] h-[16px] rounded-full border boder-basicLightGray flex items-center justify-center">
			<div className="w-[5px] h-[5px] rounded-full bg-basicLightGray block"></div>
		</div>
	);
};
const ActiveCircle = () => {
	return (
		<div className="w-[16px] h-[16px] rounded-full bg-forumBlue-normal flex items-center justify-center">
			<div className="w-[5px] h-[5px] rounded-full bg-white block"></div>
		</div>
	);
};

const CircleProgressView = ({
	size = 78,
	durationSeconds,
}: {
	size?: number;
	durationSeconds?: number;
}) => {
	return (
		<div
			className={`w-[${size}px] h-[${size}px] flex items-center justify-center relative`}
		>
			<CircleProgress size={size} durationSeconds={durationSeconds} />
			<div className="absolute w-full h-full flex justify-center items-center">
				<div className="w-[32px] h-[32px] rounded-full bg-forumBlue-normal flex items-center justify-center">
					<Image
						src="/assets/icons/step-loading.svg"
						alt="info circle icon"
						width={14}
						height={14}
					></Image>
				</div>
			</div>
		</div>
	);
};

const PageIndexStepView = () => {
	return (
		<div className="w-full flex flex-col">
			<div className="px-[30px] flex flex-row relative">
				<CircleProgressView />
				<div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
				<div className={`ml-2 mt-[30px]`}>
					<InActiveCircle />
				</div>
				<div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
				<div className={`ml-2 mt-[30px]`}>
					<InActiveCircle />
				</div>

				<p className="absolute top-[60px] left-[280px] text-sm text-grey-normal">
					Page Labeling
				</p>
				<p className="absolute top-[60px] left-[500px] text-sm text-grey-normal">
					Pre-Analysis
				</p>
			</div>
			<div className="mt-10">
				<div className="w-[140px] text-center">
					<p className="text-xl text-forumBlue-normal">Page Index</p>
					<p className="text-sm text-grey-normal">Step 1</p>
				</div>
			</div>
		</div>
	);
};

const PageLabelStepView = () => {
	return (
		<div className="w-full flex flex-col">
			<div className="px-[30px] flex flex-row relative">
				<div className={`mt-[30px]`}>
					<ActiveCircle />
				</div>
				<div className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
				<CircleProgressView />
				<div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
				<div className={`ml-2 mt-[30px]`}>
					<InActiveCircle />
				</div>

				<p className="absolute top-[60px] left-[-5px] text-sm text-forumBlue-normal">
					Page Index
				</p>
				<p className="absolute top-[60px] left-[500px] text-sm text-grey-normal">
					Pre-Analysis
				</p>
			</div>
			<div className="ml-[220px] mt-10">
				<div className="w-[140px] text-center">
					<p className="text-xl text-forumBlue-normal">Page Labeling</p>
					<p className="text-sm text-grey-normal">Step 2</p>
				</div>
			</div>
		</div>
	);
};

const PageAnalyzeStepView = () => {
	return (
		<div className="w-full flex flex-col">
			<div className="px-[30px] flex flex-row relative">
				<div className={`mt-[30px]`}>
					<ActiveCircle />
				</div>
				<div
					className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-forumBlue-normal`}
				></div>
				<div className={`mt-[30px]`}>
					<ActiveCircle />
				</div>
				<div
					className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-forumBlue-normal`}
				></div>
				<CircleProgressView />

				<p className="absolute top-[60px] left-[-5px] text-sm text-forumBlue-normal">
					Page Index
				</p>
				<p className="absolute top-[60px] left-[210px] text-sm text-forumBlue-normal">
					Page Labeling
				</p>
			</div>
			<div className="ml-[450px] mt-10">
				<div className="w-[140px] text-center">
					<p className="text-xl text-forumBlue-normal">Pre-Analysis</p>
					<p className="text-sm text-grey-normal">Step 3</p>
				</div>
			</div>
		</div>
	);
};

const BuildingBackgroundOld = ({ step }: { step: string }) => {
	const stepMap: any = {
		"page-index": {
			title: "Processing your request...",
			subTitle: "Please wait while we prepare your content.",
			description: "",
			stepComponent: <PageIndexStepView />,
		},
		"page-label": {
			title: "Cato Processing your request...",
			subTitle: "Please wait while we prepare your content.",
			description: "",
			stepComponent: <PageLabelStepView />,
		},
		"page-analyze": {
			title: "CATO will build your Take Off Quote",
			subTitle:
				"This can take a few minutes, so feel free to step away while we handle the heavy lifting.",
			description: "Estimated time: 2-5 minutes",
			stepComponent: <PageAnalyzeStepView />,
		},
	};

	const { title, subTitle, description, stepComponent } =
		stepMap[step] || stepMap["page-index"];

	return (
		<div className="h-screen w-screen z-[5000] fixed top-0 left-0 overflow-hidden flex justify-center items-center bg-white">
			<div className="w-full flex justify-end absolute">
				<Image
					src="/assets/cato-images/building-background.png"
					alt="building background"
					width={1900}
					height={1600}
					className="w-3/4 h-auto"
				/>
			</div>
			<div className="w-[608px] flex flex-col items-center">
				<div className="text-[22px] text-forumBlue-normal">{title}</div>
				<div className="mt-3 text-lg text-center">{subTitle}</div>
				{description && (
					<div className="mt-8 text-sm text-grey-normal">{description}</div>
				)}
				<div className="mt-12 w-full">{stepComponent}</div>
			</div>
		</div>
	);
};

export enum BuildLoadingStep {
	PageLabel = "page-label",
	PageMerge = "page-merge",
	PageTakeOff = "page-takeoff",
}

interface BuildingBackgroundProps {
	step: string;
	durationSeconds?: number;
}

const BuildingBackground = ({
	step,
	durationSeconds,
}: BuildingBackgroundProps) => {
	const stepMap: any = {
		"page-label": {
			title: "Processing your request...",
			subTitle:
				"We are preparing your content for page labeling. \nThis should only take a moment.",
			description: "",
		},
		"page-merge": {
			title: "Preparing merge workspace...",
			subTitle:
				"Moving to the multi-file workspace to review and merge your data.",
			description: "",
		},
		"page-takeoff": {
			title: "CATO is building your Takeoff  list",
			subTitle:
				"This can take a few minutes, so feel free to step away while we handle the heavy lifting.",
			description: "Estimated Time 2 to 5 minutes",
		},
	};

	const { title, subTitle, description } =
		stepMap[step] || stepMap["page-label"];

	return (
		<div className="h-screen w-screen z-[5000] fixed top-0 left-0 overflow-hidden flex justify-center items-center bg-white">
			<div className="w-full flex justify-end absolute">
				<Image
					src="/assets/cato-images/building-background.png"
					alt="building background"
					width={1900}
					height={1600}
					className="w-3/4 h-auto"
				/>
			</div>
			<div className="w-[608px] flex flex-col gap-5 items-center">
				<CircleProgressView size={130} durationSeconds={durationSeconds} />
				<div className="text-[22px] text-forumBlue-normal">{title}</div>
				<div className="text-base text-center whitespace-pre-line">
					{subTitle}
				</div>
				{description && (
					<div className="text-sm text-grey-normal">{description}</div>
				)}
			</div>
		</div>
	);
};

export default BuildingBackground;
