"use client";

import { ComponentType } from "react";
import Company from "@/app/brand-editor/components/body-components/company";
import Parameter from "@/app/brand-editor/components/body-components/parameter";
import ParameterBaseEditor from "@/app/brand-editor/components/body-components/product-base-editor";
import ParameterOption from "@/app/brand-editor/components/body-components/parameter-option";

const bodyMap: Record<number, ComponentType> = {
	1: () => <Company />,
	2.1 : () => <Parameter />,
	2.2 : () => <ParameterBaseEditor />,
	2.3 : () => <ParameterOption />,
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
