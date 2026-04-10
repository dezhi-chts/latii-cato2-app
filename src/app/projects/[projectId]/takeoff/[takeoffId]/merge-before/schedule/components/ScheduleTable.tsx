"use client";

import Image from "next/image";
import { Button, Input, Modal, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useLayoutEffect, useRef, useState } from "react";
import {
	getDisplayValueByField,
	parseItemResult as parseItemResultUtil,
} from "../../../analyze-new/takeoffUtils";
export interface ScheduleFileRow {
	id: number;
	key: string;
	result: Record<string, string>;
	isMerged?: boolean;
	mergedFromRows?: any[];
	evidence_id_list?: number[];
	evidence_msg?: {
		s3_url?: string;
		type?: string;
		project_file_id?: number;
		project_file_page_number?: number;
	};
}

export interface ScheduleSourceSection {
	key: string;
	title: string;
	count: number;
	conflictCount?: number;
	rows: any[];
}

interface ScheduleTableProps {
	columns: string[];
	sections: any[];
	onUpdateField: (
		updatedItem: any,
		fieldName: string,
		oldValue: string,
		newValue: string,
	) => Promise<boolean>;
	onDeleteItem: (itemId: number) => Promise<boolean>;
}

function TruncatedTextCell({ value }: { value: string }) {
	const divRef = useRef<HTMLDivElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useLayoutEffect(() => {
		const element = divRef.current;
		if (element) {
			setIsTruncated(element.scrollWidth > element.clientWidth);
		}
	}, [value]);

	return (
		<div ref={divRef} className="min-h-[20px] truncate">
			{isTruncated ? (
				<Tooltip
					title={value}
					placement="topLeft"
					color="white"
					styles={{
						body: {
							backgroundColor: "#ffffff",
							color: "#333333",
							border: "1px solid #d9d9d9",
							boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
						},
					}}
				>
					<span>{value}</span>
				</Tooltip>
			) : (
				<span>{value || "-"}</span>
			)}
		</div>
	);
}

const getColumnWidth = (title: string) => {
	if (!title) {
		return 100;
	}

	if (title.length >= 25) {
		return 220;
	}

	if (title.length >= 15) {
		return 140;
	}

	if (title.length >= 10) {
		return 120;
	}

	return 100;
};

export default function ScheduleTable({
	columns,
	sections,
	onUpdateField,
	onDeleteItem,
}: ScheduleTableProps) {
	const [editingCell, setEditingCell] = useState<{
		id: number;
		field: string;
	} | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const submittingCellKeyRef = useRef<string | null>(null);

	const startEdit = (record: any, fieldName: string) => {
		setEditingCell({ id: Number(record.id), field: fieldName });
		const currentValue = getDisplayValueByField(record?.result || {}, fieldName);
		setEditingValue(currentValue === "-" ? "" : currentValue);
	};

	const cancelEdit = () => {
		setEditingCell(null);
		setEditingValue("");
	};

	const submitEdit = async (record: any, fieldName: string) => {
		const itemId = Number(record?.id);
		if (!Number.isFinite(itemId)) {
			cancelEdit();
			return;
		}

		const currentValue = getDisplayValueByField(record?.result || {}, fieldName);
		const oldValue = currentValue === "-" ? "" : currentValue;
		const newValue = editingValue.trim();
		const submitKey = `${itemId}-${fieldName}`;

		if (submittingCellKeyRef.current === submitKey) return;
		if (newValue === oldValue) {
			cancelEdit();
			return;
		}

		const parsedResult = parseItemResultUtil(record?.result as any);
		const updatedItem = {
			...record,
			result: {
				...parsedResult,
				[fieldName]: newValue,
			},
		};

		// Blur 后立即退出编辑态，避免 Input 长时间停留
		cancelEdit();
		submittingCellKeyRef.current = submitKey;
		await onUpdateField(updatedItem, fieldName, oldValue, newValue);
		submittingCellKeyRef.current = null;
	};

	const handleDelete = (record: any) => {
		const itemId = Number(record?.id);
		if (!Number.isFinite(itemId)) return;

		Modal.confirm({
			title: "Delete Item",
			content: "Are you sure you want to delete this row?",
			okText: "Delete",
			cancelText: "Cancel",
			onOk: async () => {
				await onDeleteItem(itemId);
			},
		});
	};

	const tableColumns: ColumnsType<any> = (() => {
		const dataColumns = columns.map((fieldName) => {
			const isLabelColumn = fieldName === "Label";
			const isSubLabelColumn = fieldName === "Sub Label";

			return {
				title: (
					<div className="whitespace-nowrap text-center text-xs text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width:
					fieldName === "Label" || fieldName === "Sub Label"
						? 120
						: getColumnWidth(fieldName),
				fixed:
					isLabelColumn || isSubLabelColumn ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: any) => {
					const displayValue = getDisplayValueByField(record?.result, fieldName);
					const isEditing =
						editingCell?.id === Number(record?.id) &&
						editingCell?.field === fieldName;
					return (
						<div className="mx-auto w-full max-w-[200px] overflow-hidden text-xs">
							{isEditing ? (
								<Input
									autoFocus
									size="small"
									value={editingValue}
									onChange={(event) => setEditingValue(event.target.value)}
									onBlur={() => submitEdit(record, fieldName)}
									onKeyDown={(event) => {
										if (event.key === "Escape") {
											cancelEdit();
										}
									}}
								/>
							) : (
								<div
									className="cursor-text"
									onClick={() => startEdit(record, fieldName)}
								>
									<TruncatedTextCell value={displayValue} />
								</div>
							)}
						</div>
					);
				},
			};
		});

		const actionColumn: ColumnsType<any>[number] = {
			title: <div className="text-center text-xs text-grey-normal">Action</div>,
			key: "action",
			width: 80,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: any) => (
				<Button
					type="link"
					size="small"
					className="px-0"
					onClick={(event) => {
						event.stopPropagation();
						handleDelete(record);
					}}
				>
					<Image alt="Delete" src="/assets/icons/delete.svg" width={14} height={14} />
				</Button>
			),
		};

		return [...dataColumns, actionColumn];
	})();

	return (
		<div className="flex-1">
			<div className="min-h-0 flex-1 rounded-xl border border-primaryN30 bg-white">
				<Table<any>
					rowKey={(record) => record.id}
					columns={tableColumns}
					dataSource={sections}
					pagination={false}
					scroll={{
						x: "max-content",
						y: "calc(100vh - 500px)",
					}}
					locale={{
						emptyText: (
							<div className="py-10 text-xs text-grey-normal">
								No labels found for this source.
							</div>
						),
					}}
					className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-3 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal [&_.ant-pagination]:!my-3 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:!text-xs"
				/>
			</div>
		</div>
	);
}
