"use client";

import { Radio, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface LabelItem {
	id: string | number;
	label: string;
	subLabel: string;
	evidenceId?: number;
}

interface LabelTableProps {
	title: string;
	data: LabelItem[];
	selectedId: string | number | null;
	onSelect: (item: LabelItem) => void;
}

export default function LabelTable({
	title,
	data,
	selectedId,
	onSelect,
}: LabelTableProps) {
	const columns: ColumnsType<LabelItem> = [
		{
			title: "",
			key: "radio",
			width: 40,
			render: (_: unknown, record: LabelItem) => (
				<Radio
					checked={selectedId === record.id}
					onChange={() => onSelect(record)}
				/>
			),
		},
		{
			title: "Label",
			key: "label",
			dataIndex: "label",
			render: (text: string) => (
				<span className="text-xs text-grey-dark">{text}</span>
			),
		},
		{
			title: "Sub Label",
			key: "subLabel",
			dataIndex: "subLabel",
			render: (text: string) => (
				<span className="text-xs text-grey-dark">{text}</span>
			),
		},
	];

	return (
		<div className="mb-2">
			<div className="mb-2 text-sm font-medium text-forumBlue-normal">
				{title}
			</div>
			<Table
				size="small"
				columns={columns}
				dataSource={data}
				pagination={false}
				rowKey="id"
				scroll={{ y: "calc(100vh - 240px)" }}
				className="border border-primaryN30 rounded-md"
			/>
		</div>
	);
}
