"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Radio, Table, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import { evidenceBatchDelete, evidenceBatchUpdate } from "@/services/evidenceService";
import LoadingScreen from "@/components/loading-screen";
import Image from "next/image";

interface LabelItem {
	id: string | number;
	label: string;
	subLabel: string;
	evidenceId?: number;
	sourceItem: Record<string, any>;
}

interface LabelTableProps {
	title: string;
	data: Record<string, any>[];
	selectedId: string | number | null;
	onSelect: (item: LabelItem) => void;
	onUpdateItem?: (item: Record<string, any>) => void;
	onDeleteSuccess?: (deletedId: number) => void;
	setShowScheduleModal: (visible: boolean) => void;
}

export default function LabelTable({
	title,
	data,
	selectedId,
	onSelect,
	onUpdateItem,
	onDeleteSuccess,
	setShowScheduleModal,
}: LabelTableProps) {
	const [rows, setRows] = useState<LabelItem[]>([]);
	const [editingCell, setEditingCell] = useState<{
		id: string | number;
		field: "label" | "subLabel";
	} | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const [savingCell, setSavingCell] = useState<{
		id: string | number;
		field: "label" | "subLabel";
	} | null>(null);
	const submittingCellKeyRef = useRef<string | null>(null);
	const [fullLoading, setFullLoading] = useState(false);

	const parseOcrText = (ocrText: unknown) => {
		if (!ocrText) {
			return { origin: {}, evidenceId: undefined, result: {} as Record<string, any> };
		}

		try {
			const parsed = typeof ocrText === "string" ? JSON.parse(ocrText) : ocrText;
			return {
				origin: (parsed as Record<string, any>) || {},
				evidenceId: (parsed as Record<string, any>)?.evidence_id as number | undefined,
				result: ((parsed as Record<string, any>)?.result || {}) as Record<string, any>,
			};
		} catch {
			return { origin: {}, evidenceId: undefined, result: {} as Record<string, any> };
		}
	};

	useEffect(() => {
		const nextRows = (data || []).map((item) => {
			const { evidenceId, result } = parseOcrText(item?.ocr_text);
			return {
				id: item?.id,
				label: String(result?.Label || "-"),
				subLabel: String(result?.["Sub Label"] || "-"),
				evidenceId,
				sourceItem: item,
			};
		});
		setRows(nextRows);
	}, [data]);

	const isEditingCell = (record: LabelItem, field: "label" | "subLabel") =>
		editingCell?.id === record.id && editingCell?.field === field;

	const handleStartEdit = (record: LabelItem, field: "label" | "subLabel") => {
		if (savingCell) return;
		setEditingCell({ id: record.id, field });
		setEditingValue(record[field] === "-" ? "" : record[field]);
	};

	const handleCancelEdit = () => {
		setEditingCell(null);
		setEditingValue("");
	};

	const handleSubmitEdit = async (record: LabelItem, field: "label" | "subLabel") => {
		const trimmedValue = editingValue.trim();
		const nextDisplayValue = trimmedValue || "-";
		const submitKey = `${record.id}-${field}`;
		if (submittingCellKeyRef.current === submitKey) return;
		if (nextDisplayValue === record[field]) {
			handleCancelEdit();
			return;
		}

		submittingCellKeyRef.current = submitKey;
		const prevRows = rows;
		const resultField = field === "label" ? "Label" : "Sub Label";
		const { origin, result } = parseOcrText(record.sourceItem?.ocr_text);
		const nextOcrText = {
			...origin,
			result: {
				...result,
				[resultField]: nextDisplayValue,
			},
		};
		const updatedItem = {
			...record.sourceItem,
			ocr_text: JSON.stringify(nextOcrText),
		};

		const nextRows = rows.map((row) =>
			row.id === record.id
				? {
					...row,
					[field]: nextDisplayValue,
					sourceItem: updatedItem,
				}
				: row,
		);
		setRows(nextRows);
		setSavingCell({ id: record.id, field });
		setEditingCell(null);
		setEditingValue("");

		const response = await evidenceBatchUpdate([updatedItem]);
		setSavingCell(null);
		submittingCellKeyRef.current = null;
		if (response.status === "success") {
			onUpdateItem?.(updatedItem);
			notification.success({
				message: "Success",
				description: `${title} ${field === "label" ? "Label" : "Sub Label"} updated.`,
			});
			return;
		}

		setRows(prevRows);
		notification.error({
			message: "Error",
			description: "Failed to update label info. The table has been restored.",
		});
	};

	const handleDeleteRow = async (record: LabelItem) => {
		const rowId = Number(record.id);
		if (!Number.isFinite(rowId)) {
			notification.error({
				message: "Error",
				description: "Invalid evidence id, unable to delete.",
			});
			return;
		}

		const prevRows = rows;
		const nextRows = rows.filter((row) => row.id !== record.id);
		setRows(nextRows);
		setFullLoading(true);
		const response = await evidenceBatchDelete([rowId]);
		setFullLoading(false);

		if (response.status === "success") {
			notification.success({
				message: "Success",
				description: `${title} item deleted.`,
			});
			onDeleteSuccess?.(rowId);
			return;
		}

		setRows(prevRows);
		notification.error({
			message: "Error",
			description: "Failed to delete item. The table has been restored.",
		});
	};

	const columns: ColumnsType<LabelItem> = useMemo(
		() => [
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
				render: (text: string, record: LabelItem) =>
					isEditingCell(record, "label") ? (
						<Input
							autoFocus
							size="small"
							value={editingValue}
							disabled={savingCell?.id === record.id && savingCell?.field === "label"}
							onChange={(e) => setEditingValue(e.target.value)}
							onPressEnter={() => handleSubmitEdit(record, "label")}
							onBlur={() => handleSubmitEdit(record, "label")}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									handleCancelEdit();
								}
							}}
						/>
					) : (
						<span
							className="text-xs text-grey-dark cursor-text"
							onClick={() => handleStartEdit(record, "label")}
						>
							{text}
						</span>
					),
			},
			{
				title: "Sub Label",
				key: "subLabel",
				dataIndex: "subLabel",
				render: (text: string, record: LabelItem) =>
					isEditingCell(record, "subLabel") ? (
						<Input
							autoFocus
							size="small"
							value={editingValue}
							disabled={savingCell?.id === record.id && savingCell?.field === "subLabel"}
							onChange={(e) => setEditingValue(e.target.value)}
							onPressEnter={() => handleSubmitEdit(record, "subLabel")}
							onBlur={() => handleSubmitEdit(record, "subLabel")}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									handleCancelEdit();
								}
							}}
						/>
					) : (
						<span
							className="text-xs text-grey-dark cursor-text"
							onClick={() => handleStartEdit(record, "subLabel")}
						>
							{text}
						</span>
					),
			},
			{
				title: "",
				key: "action",
				width: 76,
				render: (_: string, record: LabelItem) => (
					<Button
						type="link"
						size="small"
						className="px-0"
						onClick={() => handleDeleteRow(record)}
					>
						<Image src='/assets/icons/delete.svg' width={15} height={15} />
					</Button>
				),
			},
		],
		[editingCell, editingValue, onSelect, onDeleteSuccess, rows, savingCell, selectedId, title],
	);

	return (
		<div className="mb-2">
			<div className="mb-2 text-sm font-medium text-forumBlue-normal flex justify-between items-center">
				<div>{title}</div>
				<div className="underline cursor-pointer" onClick={() => setShowScheduleModal(true)}>Schedule Images</div>
			</div>
			<Table
				size="small"
				columns={columns}
				dataSource={rows}
				pagination={false}
				rowKey="id"
				scroll={{ y: "calc(100vh - 240px)" }}
				className="border border-primaryN30 rounded-md"
			/>
			{fullLoading && <LoadingScreen isLoading={fullLoading} />}
		</div>
	);
}
