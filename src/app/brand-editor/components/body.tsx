import { ComponentType } from "react";
import Company from "@/app/brand-editor/components/body-components/company";

const bodyMap: Record<number, ComponentType> = {
	1: () => <Company />,
	2: () => <div />,
	3: () => <div />,
	4: () => <div />,
	5: () => <div />,
};

const Body = ({ selectedOptionId }: { selectedOptionId: number }) => {
	const Component = bodyMap[selectedOptionId];

	return (
		<div className="w-full h-full pl-10 pt-10">
			{Component ? <Component /> : null}
		</div>
	);
};

export default Body;
