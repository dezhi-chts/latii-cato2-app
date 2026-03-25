"use client";

import {
	AppstoreOutlined,
	EditOutlined,
	MergeCellsOutlined,
	SearchOutlined,
	EyeOutlined,
} from "@ant-design/icons";
import {
	Badge,
	Button,
	Input,
	Popover,
	Table,
	Tooltip,
	notification,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import Image from "next/image";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { updateField } from "@/services/projectService";

import {
	formatCellValue,
	getEvidenceIds,
	getResultValue,
	parseItemResult,
} from "../takeoffUtils";
import { TakeoffItemRecord, TemplateField } from "../types";

interface TakeoffItemsTableProps {
	items: TakeoffItemRecord[];
	dynamicFields: TemplateField[];
	loading: boolean;
	searchValue: string;
	selectedItemId: number | null;
	reconcileCount: number;
	onSearchChange: (value: string) => void;
	onToggleStatus: (item: TakeoffItemRecord, checked: boolean) => void;
	onSelectItem: (item: TakeoffItemRecord) => void;
	onOpenReferencePanel: (item: TakeoffItemRecord) => void;
	onOpenReconcile: () => void;
	onRefreshItems?: () => void;
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

export default function TakeoffItemsTable({
	items,
	dynamicFields,
	loading,
	searchValue,
	selectedItemId,
	reconcileCount,
	onSearchChange,
	onToggleStatus,
	onSelectItem,
	onOpenReferencePanel,
	onOpenReconcile,
	onRefreshItems,
}: TakeoffItemsTableProps) {
	const [tableData, setTableData] = useState<TakeoffItemRecord[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [editingCell, setEditingCell] = useState<{
		rowId: number;
		columnName: string;
	} | null>(null);

	useEffect(() => {
		setTableData(items);
	}, [items]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, searchValue]);

	const filteredItems = useMemo(() => {
		const normalizedKeyword = searchValue.trim().toLowerCase();

		if (!normalizedKeyword) {
			return tableData;
		}

		return tableData.filter((item) => {
			const labelValue = formatCellValue(getResultValue(item, "Label"));
			return labelValue.toLowerCase().includes(normalizedKeyword);
		});
	}, [searchValue, tableData]);

	const getColumnWidth = (title: string) => {
		if (!title) {
			return 100;
		}

		if (title.length >= 25) {
			return 220;
		}

		if (title.length >= 15 && title.length < 25) {
			return 140;
		}

		if (title.length >= 10 && title.length < 15) {
			return 120;
		}

		return 100;
	};

	const rowSelection: TableProps<TakeoffItemRecord>["rowSelection"] = {
		type: "radio",
		selectedRowKeys: selectedItemId ? [selectedItemId] : [],
		onChange: (_, selectedRows) => {
			const nextSelectedItem = selectedRows?.[0];
			if (nextSelectedItem) {
				onSelectItem(nextSelectedItem);
			}
		},
		columnWidth: 42,
	};

	const columns = useMemo<ColumnsType<TakeoffItemRecord>>(() => {
		const renderField = (record: TakeoffItemRecord, fieldName: string) => {
			const fieldValue = getResultValue(record, fieldName);
			const displayValue =
				typeof fieldValue === "object"
					? JSON.stringify(fieldValue)
					: formatCellValue(fieldValue);
			const isEditing =
				editingCell?.rowId === record.id &&
				editingCell?.columnName === fieldName;

			if (isEditing) {
				return (
					<div
						className="w-full h-full min-h-[20px]"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<input
							defaultValue={displayValue === "-" ? "" : displayValue}
							autoFocus
							className="input-focus bg-primaryN30"
							style={{
								width: "100%",
								minWidth: "100%",
								textAlign: "center",
								boxShadow: "none",
							}}
							onClick={(event) => event.stopPropagation()}
							onBlur={async (event) => {
								setEditingCell(null);

								const currentItem = tableData.find(
									(item) => item.id === record.id,
								);
								if (!currentItem) {
									return;
								}

								const originalValue = getResultValue(currentItem, fieldName);
								const normalizedOriginalValue =
									typeof originalValue === "object"
										? JSON.stringify(originalValue)
										: String(originalValue ?? "");
								const normalizedNextValue = event.target.value;

								if (normalizedOriginalValue === normalizedNextValue) {
									return;
								}

								const nextResultObject = {
									...parseItemResult(currentItem.result),
									[fieldName]: normalizedNextValue,
								};
								const nextResult = JSON.stringify(nextResultObject);

								setTableData((prev) => {
									return prev.map((item) => {
										if (item.id === record.id) {
											return {
												...item,
												result: nextResult,
											};
										}

										return item;
									});
								});

								const response = await updateField(record.id, nextResult);
								if (response) {
									if (fieldName === "Label") {
										onRefreshItems?.();
									}
									return;
								}

								notification.error({
									message: "Error",
									description: "Failed to update field",
								});
							}}
						/>
					</div>
				);
			}

			return (
				<div
					className="w-full h-full min-h-[20px] text-xs max-w-[200px]"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						className="overflow-hidden"
						onClick={(event) => {
							event.stopPropagation();
							setEditingCell({ rowId: record.id, columnName: fieldName });
						}}
					>
						<TruncatedTextCell value={displayValue} />
					</div>
				</div>
			);
		};

		const labelColumn: ColumnsType<TakeoffItemRecord>[number] = {
			title: <div className="text-center text-xs text-grey-normal">Label</div>,
			key: "Label",
			dataIndex: "Label",
			minWidth: 100,
			fixed: "left",
			align: "center",
			render: (_: unknown, record: TakeoffItemRecord) => {
				return renderField(record, "Label");
			},
		} as any;

		const leftPinnedColumns: ColumnsType<TakeoffItemRecord> = [];
		const regularColumns: ColumnsType<TakeoffItemRecord> = [];

		dynamicFields
			.filter((field) => field?.name?.toLowerCase() !== "label")
			.map((field) => {
				const normalizedFieldName = field?.name?.trim()?.toLowerCase() || "";
				const isSpecialNotesColumn = normalizedFieldName === "special notes";
				const isSubLabelColumn =
					normalizedFieldName === "sub label" ||
					normalizedFieldName === "sub-label" ||
					normalizedFieldName === "sublabel";
				let title = field?.name || "";
				const splitArr = title.split(".");

				if (splitArr.length > 1) {
					title = splitArr
						.map((item, index) => {
							return index === 0 ? `${item}\n` : item;
						})
						.join("");
				}

				const columnWidth = getColumnWidth(title);

				const nextColumn: ColumnsType<TakeoffItemRecord>[number] = {
					title: (
						<div className="text-center whitespace-nowrap text-xs text-grey-normal">
							{title}
						</div>
					),
					dataIndex: field?.name,
					minWidth: columnWidth,
					width: columnWidth,
					fixed: isSubLabelColumn ? "left" : undefined,
					align: "center",
					render: (_: unknown, record: TakeoffItemRecord) => {
						return renderField(record, field?.name);
					},
				} as any;

				if (isSubLabelColumn) {
					leftPinnedColumns.push(nextColumn);
					return nextColumn;
				}

				regularColumns.push(nextColumn);
				return nextColumn;
			});

		const statusColumn: ColumnsType<TakeoffItemRecord>[number] = {
			title: <div className="text-center text-xs text-grey-normal">Status</div>,
			key: "status",
			width: 60,
			fixed: "right",
			align: "center",
			render: (_, record) => {
				return (
					<div className="flex items-center justify-center">
						<button
							type="button"
							className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
								record?.is_checked
									? "border-green-normal bg-green-normal text-white"
									: "border-basicLightGray bg-transparent text-transparent"
							}`}
							onClick={(event) => {
								event.stopPropagation();
								onToggleStatus(record, !record?.is_checked);
							}}
						>
							✓
						</button>
					</div>
				);
			},
		};

		const evidenceColumn: ColumnsType<TakeoffItemRecord>[number] = {
			title: <div className="text-center text-xs text-grey-normal" />,
			key: "evidences",
			width: 146,
			fixed: "right",
			align: "center",
			render: (_, record) => {
				const evidenceCount = getEvidenceIds(record).length;

				return (
					<div className="flex items-center justify-center gap-1">
						<button
							type="button"
							disabled={!evidenceCount}
							className={`flex h-6 items-center gap-1 px-2 text-[10px] transition-colors`}
							onClick={(event) => {
								event.stopPropagation();
								if (evidenceCount) {
									onOpenReferencePanel(record);
								}
							}}
						>
							<Image
								src="/assets/icons/file-refrence.svg"
								alt=""
								width={14}
								height={14}
							/>
							<span className="rounded-md bg-loadingGray px-[6px] text-[8px] leading-4 text-grey-dark">
								{evidenceCount}
							</span>
						</button>
					</div>
				);
			},
		};

		return [
			labelColumn,
			...leftPinnedColumns,
			...regularColumns,
			statusColumn,
			evidenceColumn,
		];
	}, [
		dynamicFields,
		editingCell,
		onOpenReferencePanel,
		onRefreshItems,
		onToggleStatus,
		tableData,
	]);

	return (
		<div className="flex h-full min-w-0 flex-1 flex-col gap-6 overflow-hidden pr-6">
			<div className="flex items-center justify-between pt-10">
				<div className="flex items-center gap-3">
					<Input
						value={searchValue}
						onChange={(event) => onSearchChange(event.target.value)}
						prefix={<SearchOutlined className="text-grey-normal" />}
						className="!h-[32px] !w-[365px] !rounded-md !border-primaryN30 text-xs"
						placeholder="Search label"
					/>
					<Button
						className="!h-[32px] !rounded-md !border-primaryN30 !px-4 !text-xs !text-grey-dark"
						icon={<EyeOutlined />}
						onClick={() => onSearchChange("")}
					>
						Show All
					</Button>
					<Button
						className="!h-[32px] !rounded-md !border-primaryN30 !px-4 !text-xs !text-grey-dark"
						icon={<AppstoreOutlined />}
					>
						Columns
					</Button>
					<Button
						className="!h-[32px] !rounded-md !border-primaryN30 !px-4 !text-xs !text-grey-dark"
						icon={<EditOutlined />}
					>
						Quick Edit
					</Button>
				</div>

				<Button
					className="!h-[32px] !rounded-md !border-primaryN30 !px-4 !text-xs !text-grey-dark"
					onClick={onOpenReconcile}
				>
					Reconcile
					<Badge
						count={reconcileCount}
						overflowCount={999}
						className="ml-2 [&_.ant-badge-count]:!bg-[#717171] [&_.ant-badge-count]:!text-white [&_.ant-badge-count]:!shadow-none"
					/>
				</Button>
			</div>

			<div className="flex min-h-0 flex-1">
				<div className="rounded-l-lg h-[calc(100vh-320px)] border-[3px] border-forumBlue-normal" />
				<div className="min-h-0 flex-1 overflow-hidden">
					<Table<TakeoffItemRecord>
						rowKey={(record) => record?.id}
						rowSelection={rowSelection}
						loading={loading}
						columns={columns}
						dataSource={filteredItems}
						pagination={{
							current: currentPage,
							pageSize: 30,
							total: filteredItems.length,
							position: ["bottomRight"],
							showSizeChanger: false,
							onChange: (page) => setCurrentPage(page),
						}}
						scroll={{ x: "max-content", y: "calc(100vh - 355px)" }}
						onRow={(record) => ({
							onClick: () => onSelectItem(record),
						})}
						rowClassName={() => "cursor-pointer"}
						className="h-full [&_.ant-pagination]:!m-0 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:!py-3 [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-pagination]:!border-t [&_.ant-table-pagination]:!border-primaryN30 [&_.ant-table-tbody>tr>td]:!py-3 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
						locale={{
							emptyText: (
								<div className="py-10 text-xs text-grey-normal">
									No items found for this file.
								</div>
							),
						}}
					/>
				</div>
			</div>
		</div>
	);
}
