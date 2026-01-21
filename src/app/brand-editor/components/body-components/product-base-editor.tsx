"use client";

import { Button } from 'antd';

const ParameterBaseEditor = () => {

	return (
		<div
			className="pr-6 flex w-full overflow-x-auto"
			style={{ height: "calc(100vh - 195px)", fontSize:"14px"}}
		>
			<div className="flex flex-nowrap">  {/* 横向排列，不换行 */}
				<div className="w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Profile/Line</div>
					</div>
					<div>
						<div>

						</div>
					</div>
				</div>
				<div className="w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5 justify-between">
						<div>Types</div>
						<Button size='small' className='text-[#717171] text-[12px]'>Copy & Move to</Button>
					</div>
					<div></div>
				</div>
				<div className="w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Opens</div>
					</div>
					<div></div>
				</div>
				<div className="w-[350px] h-full border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Drawing & Shape</div>
					</div>
					<div></div>
				</div>
			</div>
		</div>
	);
};

export default ParameterBaseEditor;
