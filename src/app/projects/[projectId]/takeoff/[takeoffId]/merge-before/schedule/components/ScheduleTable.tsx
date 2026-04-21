"use client";

import Image from "next/image";
import { Button, Checkbox, Input, Modal, Table, Tooltip, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useLayoutEffect, useRef, useState } from "react";
import {
	getDisplayValueByField,
	parseItemResult as parseItemResultUtil,
} from "../../../analyze-new/takeoffUtils";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { notify } from "@/utils/notify";


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
	tableLoading: boolean;
	onUpdateField: (
		updatedItem: any,
		fieldName: string,
		oldValue: string,
		newValue: string,
	) => Promise<boolean>;
	onDeleteItem: (itemId: number) => Promise<boolean>;
	onOpenCreateItemModal: () => void;
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
	tableLoading,
	onUpdateField,
	onDeleteItem,
	onOpenCreateItemModal
}: ScheduleTableProps) {
	const [editingCell, setEditingCell] = useState<{
		id: number;
		field: string;
	} | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const submittingCellKeyRef = useRef<string | null>(null);
	const [batchSelectedIds, setBatchSelectedIds] = useState<number[]>([]);


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
		if (fieldName === "Label" && !newValue) {
			notification.error({
				message: "Error",
				description: "Label cannot be empty.",
			});
			// Exit editing mode and keep previous value from parent state.
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

	const handleToggleBatchSelected = (rowId: number, checked: boolean) => {
		setBatchSelectedIds((prev) => {
			if (checked) {
				if (prev.includes(rowId)) return prev;
				return [...prev, rowId];
			}
			return prev.filter((id) => id !== rowId);
		});
	};

	const handleOpenBatchEdit = () => {
		if (!batchSelectedIds.length) {
			notify.warning({
				title: "Warning",
				description: "Please select items to process.",
			});
			return;
		}
		notify.warning({
			title: "Warning",
			description: "Function development is in progress. Please wait.",
		});
	};

	const handleBatchDelete = () => {
		if (!batchSelectedIds.length) {
			notify.warning({
				title: "Warning",
				description: "Please select items to process.",
			});
			return;
		}
		notify.warning({
			title: "Warning",
			description: "Function development is in progress. Please wait.",
		});
		return;
		const selectedLabels = sections
			.filter((row) => batchSelectedIds.includes(Number(row.id)))
			.map((row) => row.label)
			.filter(Boolean);
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

		const checkedColumn = {
			title: "",
			key: "checkbox",
			width: 36,
			align: "center",
			render: (_: unknown, record: any) => {
				const rowId = Number(record.id);
				return (
					<Checkbox
						checked={batchSelectedIds.includes(rowId)}
						onChange={(event) =>
							handleToggleBatchSelected(rowId, event.target.checked)
						}
					/>
				);
			}
		};

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

		return [checkedColumn, ...dataColumns, actionColumn];
	})();

	return (
		<div className="flex-1">
			<div className="mb-3 flex items-center justify-between">
				<div className="text-xs text-grey-normal">{sections.length} items</div>
				<div className="flex items-center gap-2">
					<Tooltip title="Edit Labels">
						<div
							className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
							onClick={() => {
								handleOpenBatchEdit();
							}}
						>
							<EditOutlined className="text-[12px]" />
						</div>
					</Tooltip>
					<Tooltip title="Delete Labels">
						<div
							className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
							onClick={() => {
								handleBatchDelete();
							}}
						>
							<DeleteOutlined className="text-[12px]" />
						</div>
					</Tooltip>
					<Button
						className="custom-primary-btn !w-[60px] !text-xs"
						onClick={() => onOpenCreateItemModal?.()}
					>
						+ Item
					</Button>
				</div>

			</div>
			<div className="min-h-0 flex-1 rounded-xl border border-primaryN30 bg-white">
				<Table<any>
					rowKey={(record) => record.id}
					columns={tableColumns}
					dataSource={sections}
					pagination={false}
					loading={tableLoading}
					scroll={{
						x: "max-content",
						y: "calc(100vh - 280px)",
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
