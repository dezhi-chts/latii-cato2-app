"use client";

import Image from "next/image";
import { Button, Card, Checkbox, Empty, Input, Modal, Radio, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	getDisplayValueByField,
	parseItemResult as parseItemResultUtil,
	setResultValueByField,
} from "../../../analyze-new/takeoffUtils";
import {
	EditOutlined,
	DeleteOutlined,
	CopyOutlined,
	ColumnWidthOutlined,
	AppstoreOutlined,
	TableOutlined,
} from "@ant-design/icons";
import { notify } from "@/utils/notify";
import {
	addMultipleTakeOffResultItems,
	deleteMultipleTakeOffResultItems,
	updateMultipleTakeOffResultItems,
} from "@/services/takeOffService";


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
	takeOffId: string;
	selectedFileId: number | null;
	pageEvidenceId: number;
	onUpdateField: (
		updatedItem: any,
		fieldName: string,
		oldValue: string,
		newValue: string,
	) => Promise<boolean>;
	onDeleteItem: (itemId: number) => Promise<boolean>;
	onCreateItem: () => Promise<void> | void;
	onOpenColumnSelector?: () => void;
	onBatchActionSuccess?: () => Promise<void> | void;
	focusedItemId?: number | null;
	onFocusItemChange?: (itemId: number) => void;
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
	takeOffId,
	selectedFileId,
	pageEvidenceId,
	onUpdateField,
	onDeleteItem,
	onCreateItem,
	onOpenColumnSelector,
	onBatchActionSuccess,
	focusedItemId = null,
	onFocusItemChange,
}: ScheduleTableProps) {
	const tableContainerRef = useRef<HTMLDivElement | null>(null);
	const [viewMode, setViewMode] = useState<"table" | "card">("table");
	const [editingCell, setEditingCell] = useState<{
		id: number;
		field: string;
	} | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const submittingCellKeyRef = useRef<string | null>(null);
	const [batchSelectedIds, setBatchSelectedIds] = useState<number[]>([]);
	const [copyModalOpen, setCopyModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [batchSubmitting, setBatchSubmitting] = useState(false);
	const [batchEditValues, setBatchEditValues] = useState<Record<string, string>>({});
	const hasRows = sections.length > 0;


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
			notify.error({
				title: "Error",
				description: "Label cannot be empty.",
			});
			// Exit editing mode and keep previous value from parent state.
			cancelEdit();
			return;
		}

		const parsedResult = parseItemResultUtil(record?.result as any);
		const nextResult = setResultValueByField(parsedResult, fieldName, newValue);
		const updatedItem = {
			...record,
			result: nextResult,
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

	const selectedRows = useMemo(
		() =>
			sections.filter((row) => {
				const rowId = Number(row?.id);
				return Number.isFinite(rowId) && batchSelectedIds.includes(rowId);
			}),
		[batchSelectedIds, sections],
	);

	const selectedPreviewRows = useMemo(
		() =>
			selectedRows.map((row) => ({
				key: row.id,
				id: row.id,
				label: getDisplayValueByField(parseItemResultUtil(row?.result as any), "Label"),
				subLabel: getDisplayValueByField(parseItemResultUtil(row?.result as any), "Sub Label"),
			})),
		[selectedRows],
	);

	useEffect(() => {
		// Clear stale selections when switching source/image context.
		setBatchSelectedIds([]);
		resetBatchModals();
	}, [selectedFileId, pageEvidenceId]);

	useEffect(() => {
		// Data refresh can invalidate previously selected ids.
		const validIds = new Set(
			sections
				.map((row) => Number(row?.id))
				.filter((rowId) => Number.isFinite(rowId)),
		);
		setBatchSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
	}, [sections]);

	useEffect(() => {
		if (focusedItemId === null) return;
		const container = tableContainerRef.current;
		if (!container) return;

		if (viewMode === "table") {
			const body = container.querySelector(".ant-table-body") as HTMLElement | null;
			const row = container.querySelector(
				`.ant-table-tbody tr[data-row-key="${focusedItemId}"]`,
			) as HTMLElement | null;
			if (!body || !row) return;

			const bodyRect = body.getBoundingClientRect();
			const rowRect = row.getBoundingClientRect();
			const padding = 8;

			if (rowRect.top < bodyRect.top) {
				body.scrollTop -= bodyRect.top - rowRect.top + padding;
				return;
			}
			if (rowRect.bottom > bodyRect.bottom) {
				body.scrollTop += rowRect.bottom - bodyRect.bottom + padding;
			}
			return;
		}

		const cardContainer = container.querySelector(
			".schedule-card-scroll",
		) as HTMLElement | null;
		const card = container.querySelector(
			`[data-card-row-key="${focusedItemId}"]`,
		) as HTMLElement | null;
		if (!cardContainer || !card) return;
		card.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [focusedItemId, sections, viewMode]);

	const cardFieldNames = useMemo(() => {
		const fieldSet = new Set<string>(columns);
		sections.forEach((row) => {
			const parsedResult = parseItemResultUtil((row as any)?.result as any) || {};
			Object.keys(parsedResult).forEach((fieldName) => {
				if (fieldName) fieldSet.add(fieldName);
			});
		});
		return Array.from(fieldSet);
	}, [columns, sections]);

	const selectedPreviewColumns: ColumnsType<any> = [
		{
			title: "Label",
			dataIndex: "label",
			key: "label",
			width: 180,
			render: (value: string) => <TruncatedTextCell value={value || "-"} />,
		},
		{
			title: "Sub Label",
			dataIndex: "subLabel",
			key: "subLabel",
			width: 180,
			render: (value: string) => <TruncatedTextCell value={value || "-"} />,
		},
	];

	const resetBatchModals = () => {
		setCopyModalOpen(false);
		setEditModalOpen(false);
		setDeleteModalOpen(false);
		setBatchEditValues({});
	};

	const handleBatchCopy = () => {
		if (!selectedRows.length) {
			notify.warning({
				title: "Warning",
				description: "Please select items to process.",
			});
			return;
		}
		setCopyModalOpen(true);
	};

	const handleOpenBatchEdit = () => {
		if (!selectedRows.length) {
			notify.warning({
				title: "Warning",
				description: "Please select items to process.",
			});
			return;
		}
		setBatchEditValues({});
		setEditModalOpen(true);
	};

	const handleBatchDelete = () => {
		if (!selectedRows.length) {
			notify.warning({
				title: "Warning",
				description: "Please select items to process.",
			});
			return;
		}
		setDeleteModalOpen(true);
	};

	const handleConfirmBatchCopy = async () => {
		if (!selectedRows.length) return;
		if (!takeOffId || !selectedFileId || pageEvidenceId === -1) {
			notify.error({
				title: "Error",
				description: "Missing takeoff context, unable to copy labels.",
			});
			return;
		}

		const payload = selectedRows.map((row) => ({
			take_off_id: takeOffId,
			project_file_id: selectedFileId,
			evidence_id: pageEvidenceId,
			result: parseItemResultUtil(row?.result as any),
		}));

		setBatchSubmitting(true);
		try {
			const response = await addMultipleTakeOffResultItems(payload);
			if (response.status !== "success") {
				notify.error({
					title: "Error",
					description: response?.data?.detail || "Failed to copy labels.",
				});
				return;
			}
			notify.success({
				title: "Success",
				description: "Labels copied successfully.",
			});
			resetBatchModals();
			setBatchSelectedIds([]);
			await onBatchActionSuccess?.();
		} finally {
			setBatchSubmitting(false);
		}
	};

	const handleConfirmBatchEdit = async () => {
		if (!selectedRows.length) return;
		const changedEntries = Object.entries(batchEditValues)
			.map(([field, value]) => [field, value.trim()] as const)
			.filter(([, value]) => Boolean(value));

		if (changedEntries.length === 0) {
			notify.warning({
				title: "No Updates",
				description: "Please fill at least one field.",
			});
			return;
		}

		const payload = selectedRows.map((row) => {
			let nextResult = parseItemResultUtil(row?.result as any) as Record<string, any>;
			changedEntries.forEach(([field, value]) => {
				nextResult = setResultValueByField(nextResult, field, value);
			});
			return {
				take_off_result_item_id: row.id,
				result: nextResult,
			};
		});

		setBatchSubmitting(true);
		try {
			const response = await updateMultipleTakeOffResultItems(payload);
			if (response.status !== "success") {
				notify.error({
					title: "Error",
					description: response?.data?.detail || "Failed to edit labels.",
				});
				return;
			}
			notify.success({
				title: "Success",
				description: "Labels updated successfully.",
			});
			resetBatchModals();
			setBatchSelectedIds([]);
			await onBatchActionSuccess?.();
		} finally {
			setBatchSubmitting(false);
		}
	};

	const handleConfirmBatchDelete = async () => {
		if (!selectedRows.length) return;
		const ids = selectedRows.map((row) => String(row.id)).filter(Boolean);
		if (!ids.length) return;

		setBatchSubmitting(true);
		try {
			const response = await deleteMultipleTakeOffResultItems(ids.join(","));
			if (response.status !== "success") {
				notify.error({
					title: "Error",
					description: response?.data?.detail || "Failed to delete labels.",
				});
				return;
			}
			notify.success({
				title: "Success",
				description: "Labels deleted successfully.",
			});
			resetBatchModals();
			setBatchSelectedIds([]);
			await onBatchActionSuccess?.();
		} finally {
			setBatchSubmitting(false);
		}
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
					hasRows && (isLabelColumn || isSubLabelColumn)
						? ("left" as const)
						: undefined,
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
			title: '',
			key: "checkbox",
			width: 36,
			fixed: "left" as const,
			align: "center" as const,
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

		const focusColumn = {
			title: "",
			key: "focus",
			width: 36,
			align: "center" as const,
			render: (_: unknown, record: any) => {
				const rowId = Number(record.id);
				const checked = Number.isFinite(rowId) && focusedItemId === rowId;
				return (
					<Radio
						checked={checked}
						onChange={() => {
							if (!Number.isFinite(rowId)) return;
							onFocusItemChange?.(rowId);
						}}
					/>
				);
			},
		};

		const actionColumn: ColumnsType<any>[number] = {
			title: <div className="text-center text-xs text-grey-normal">Action</div>,
			key: "action",
			width: 80,
			fixed: hasRows ? "right" : undefined,
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

		return hasRows
			? [checkedColumn, focusColumn, ...dataColumns, actionColumn]
			: [...dataColumns, actionColumn];
	})();

	return (
		<>
			<div className="flex-1">
				<div className="mb-3 flex items-center justify-between">
					<div className="text-xs text-grey-normal">{sections.length} items</div>
					<div className="flex items-center gap-2">
						<Tooltip title="Copy Labels">
							<div
								className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
								onClick={() => {
									handleBatchCopy();
								}}
							>
								<CopyOutlined className="text-[12px]" />
							</div>
						</Tooltip>
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
						<Tooltip title="Columns">
							<div
								className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
								onClick={() => {
									onOpenColumnSelector?.();
								}}
							>
								<ColumnWidthOutlined className="text-[12px]" />
							</div>
						</Tooltip>
						<Tooltip title={viewMode === "table" ? "Switch to Card View" : "Switch to Table View"}>
							<div
								className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
								onClick={() => setViewMode((prev) => (prev === "table" ? "card" : "table"))}
							>
								{viewMode === "table" ? (
									<AppstoreOutlined className="text-[12px]" />
								) : (
									<TableOutlined className="text-[12px]" />
								)}
							</div>
						</Tooltip>
						<Button
							className="custom-primary-btn !w-[60px] !text-xs"
							onClick={() => onCreateItem?.()}
						>
							+ Item
						</Button>
					</div>

				</div>
				<div
					ref={tableContainerRef}
					className="min-h-0 flex-1 rounded-xl border border-primaryN30 bg-white"
				>
					{viewMode === "table" ? (
						<Table<any>
							rowKey={(record) => record.id}
							columns={tableColumns}
							dataSource={sections}
							pagination={false}
							loading={tableLoading}
							scroll={
								sections.length > 0 ? {
									x: "max-content",
									y: "calc(100vh - 280px)",
								} : {
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
							tableLayout="fixed"
						/>
					) : (
						<div className="schedule-card-scroll h-[calc(100vh-200px)] overflow-auto p-3">
							{sections.length === 0 ? (
								<div className="flex h-full items-center justify-center">
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description={<span className="text-xs text-grey-normal">No labels found for this source.</span>}
									/>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									{sections.map((record: any) => {
										const rowId = Number(record?.id);
										const parsedResult = parseItemResultUtil((record as any)?.result as any) || {};
										const rowLabel = getDisplayValueByField(parsedResult, "Label") || `Item ${rowId}`;
										return (
											<Card
												key={record.id}
												data-card-row-key={rowId}
												size="small"
												className={`border transition-shadow ${focusedItemId === rowId ? "border-forumBlue-normal shadow-md" : "border-primaryN30 hover:shadow-sm"}`}
												title={
													<div className="flex items-center justify-between">
														<div className="min-w-0 truncate text-xs font-semibold text-grey-dark">{rowLabel}</div>
														<div className="ml-2 flex items-center gap-2">
															<Checkbox
																checked={batchSelectedIds.includes(rowId)}
																onChange={(event) =>
																	handleToggleBatchSelected(rowId, event.target.checked)
																}
															/>
															<Radio
																checked={Number.isFinite(rowId) && focusedItemId === rowId}
																onChange={() => {
																	if (!Number.isFinite(rowId)) return;
																	onFocusItemChange?.(rowId);
																}}
															/>
															<Button
																type="link"
																size="small"
																className="!px-0"
																onClick={(event) => {
																	event.stopPropagation();
																	handleDelete(record);
																}}
															>
																<Image alt="Delete" src="/assets/icons/delete.svg" width={16} height={16} />
															</Button>
														</div>
													</div>
												}
											>
												<div className="grid grid-cols-1 gap-2">
													{cardFieldNames.map((fieldName) => {
														const displayValue = getDisplayValueByField(parsedResult, fieldName);
														const isEditing =
															editingCell?.id === Number(record?.id) &&
															editingCell?.field === fieldName;
														const fieldLabel = String(fieldName || "").replaceAll(".", ". ");
														return (
															<div
																key={`${record.id}-${fieldName}`}
																className="grid grid-cols-[minmax(150px,40%)_1fr] items-start gap-2 text-xs"
															>
																<Tooltip title={fieldName}>
																	<div className="shrink-0 whitespace-normal break-words leading-5 text-grey-normal">
																		{fieldLabel}
																	</div>
																</Tooltip>
																<div className="min-w-0 flex-1">
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
																			className="cursor-text rounded px-1 py-[2px] hover:bg-primaryN20"
																			onClick={() => startEdit(record, fieldName)}
																		>
																			<TruncatedTextCell value={displayValue} />
																		</div>
																	)}
																</div>
															</div>
														);
													})}
												</div>
											</Card>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<Modal
				open={copyModalOpen}
				title="Copy Labels"
				okText="Confirm"
				cancelText="Cancel"
				onCancel={() => setCopyModalOpen(false)}
				onOk={handleConfirmBatchCopy}
				confirmLoading={batchSubmitting}
			>
				<div className="mb-2 text-sm text-grey-normal">
					Please confirm the selected labels to copy:
				</div>
				<Table<any>
					rowKey="key"
					columns={selectedPreviewColumns}
					dataSource={selectedPreviewRows}
					pagination={false}
					scroll={{ y: 280 }}
					size="small"
				/>
			</Modal>

			<Modal
				open={editModalOpen}
				title="Edit Labels"
				okText="Confirm"
				cancelText="Cancel"
				onCancel={() => setEditModalOpen(false)}
				onOk={handleConfirmBatchEdit}
				confirmLoading={batchSubmitting}
				width={900}
				styles={{
					body: {
						maxHeight: "70vh",
						overflow: "hidden",
					},
				}}
			>
				<div className="flex max-h-[calc(70vh-24px)] flex-col gap-3">
					<div>
						<div className="mb-2 text-sm text-grey-normal">
							Selected items:
						</div>
						<Table<any>
							rowKey="key"
							columns={selectedPreviewColumns}
							dataSource={selectedPreviewRows}
							pagination={false}
							scroll={{ y: 220 }}
							size="small"
						/>
					</div>
					<div>
						<div className="mb-2 text-sm text-grey-normal">
							Update fields (fill one or more fields):
						</div>
						<div className="max-h-[320px] overflow-y-auto pr-1">
							<div className="grid grid-cols-2 gap-x-6 gap-y-3">
								{columns.map((fieldName) => (
									<div key={`edit-${fieldName}`} className="flex items-center gap-2">
										<span className="w-[140px] shrink-0 text-xs text-grey-normal">
											{fieldName}
										</span>
										<Input
											placeholder={`Input ${fieldName}`}
											value={batchEditValues[fieldName] || ""}
											onChange={(event) =>
												setBatchEditValues((prev) => ({
													...prev,
													[fieldName]: event.target.value,
												}))
											}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<Modal
				open={deleteModalOpen}
				title="Delete Labels"
				okText="Confirm"
				cancelText="Cancel"
				okButtonProps={{ danger: true }}
				onCancel={() => setDeleteModalOpen(false)}
				onOk={handleConfirmBatchDelete}
				confirmLoading={batchSubmitting}
			>
				<div className="mb-2 text-sm text-grey-normal">
					Please confirm the selected labels to delete:
				</div>
				<Table<any>
					rowKey="key"
					columns={selectedPreviewColumns}
					dataSource={selectedPreviewRows}
					pagination={false}
					scroll={{ y: 280 }}
					size="small"
				/>
			</Modal>
		</>
	);
}
