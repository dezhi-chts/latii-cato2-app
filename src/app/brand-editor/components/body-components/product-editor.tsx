"use client";

import { Select } from "antd";

const ProductEditor = () => {
	return (
		<div className="mt-[-20px] pr-6 h-[calc(100vh-160px)] flex text-[14px]">
			<div className="w-[360px] border border-[#E8E8E8] rounded-md h-full overflow-y-auto">
				<div className="p-4 bg-[#ECF2FA] px-6 pb-6">
					<div className="text-[#427CCE]">Product Editor</div>
					<div className="text-[#717171] text-[10px]">Select the product specifications to start editing</div>
					<div className="text-xs flex items-center mt-4 text-[#717171]">
						<span className="w-[60px]">Profile</span>
						<div className="flex-1">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full"
							>
							</Select>
						</div>
					</div>
					<div className="text-xs flex items-center mt-2 text-[#717171]">
						<span className="w-[60px]">Type</span>
						<div className="flex-1">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full"
							>
							</Select>
						</div>
					</div>
					<div className="text-xs flex items-center mt-2 text-[#717171]">
						<span className="w-[60px]">Open</span>
						<div className="flex-1">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full"
							>
							</Select>
						</div>
					</div>
				</div>
				<div className="p-6">
					<div className="text-xs text-[#a3a3a3]">
						Select the product specifications to see Sections and Constrains.
					</div>
				</div>
			</div>
			<div className="flex-1 border border-[#E8E8E8] rounded-md ml-4 h-full overflow-y-auto">

			</div>
		</div>
	);
};

export default ProductEditor;
