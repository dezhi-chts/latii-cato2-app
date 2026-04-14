"use client";

import {
	AppstoreOutlined,
	CopyOutlined,
	DeleteOutlined,
	EditOutlined,
	MergeCellsOutlined,
	SearchOutlined,
	EyeOutlined,
	UpOutlined,
	DownOutlined,
} from "@ant-design/icons";
import {
	Badge,
	Button,
	Input,
	Modal,
	Popover,
	Table,
	Tooltip,
	notification,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import Image from "next/image";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
	updateTakeOffResultItem,
	addTakeOffResultItem,
	deleteTakeOffResultItem,
} from "@/services/takeOffService";

import {
	formatCellValue,
	formatDisplayValue,
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
	takeoffId: string;
	onSearchChange: (value: string) => void;
	onToggleStatus: (item: TakeoffItemRecord, checked: boolean) => void;
	onSelectItem: (item: TakeoffItemRecord) => void;
	onOpenReferencePanel: (item: TakeoffItemRecord) => void;
	onOpenReconcile: () => void;
	onRefreshItems?: () => Promise<void> | void;
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
	takeoffId,
	onSearchChange,
	onToggleStatus,
	onSelectItem,
	onOpenReferencePanel,
	onOpenReconcile,
	onRefreshItems,
}: TakeoffItemsTableProps) {
	const [tableData, setTableData] = useState<TakeoffItemRecord[]>([]);
	const [editingCell, setEditingCell] = useState<{
		rowId: number;
		columnName: string;
	} | null>(null);
	const [selectedRowKey, setSelectedRowKey] = useState<number | null>(null);
	const [copyLoading, setCopyLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [collapsedGroupMap, setCollapsedGroupMap] = useState<Record<string, boolean>>({});

	useEffect(() => {
		setTableData(items);
	}, [items]);

	const normalizeLabel = (value: unknown) => formatCellValue(value).trim().toLowerCase();
	const getLabelKey = (item: TakeoffItemRecord) =>
		normalizeLabel(getResultValue(item, "Label"));
	const getSubLabelText = (item: TakeoffItemRecord) =>
		formatCellValue(getResultValue(item, "Sub Label")).trim();

	interface LabelGroup {
		groupKey: string;
		labelText: string;
		parent: TakeoffItemRecord;
		children: TakeoffItemRecord[];
		isSystemGroup: boolean;
	}

	type DisplayRow = TakeoffItemRecord & {
		__isSystemParent?: boolean;
		__isSystemChild?: boolean;
		__groupKey?: string;
	};

	const labelGroups = useMemo<LabelGroup[]>(() => {
		const groupedMap = new Map<string, TakeoffItemRecord[]>();
		tableData.forEach((item) => {
			const key = getLabelKey(item);
			if (!key) return;
			if (!groupedMap.has(key)) groupedMap.set(key, []);
			groupedMap.get(key)?.push(item);
		});

		const visited = new Set<string>();
		const groups: LabelGroup[] = [];
		tableData.forEach((item) => {
			const key = getLabelKey(item);
			if (!key || visited.has(key)) return;
			visited.add(key);
			const sameLabelItems = groupedMap.get(key) || [item];

			if (sameLabelItems.length < 2) {
				groups.push({
					groupKey: key,
					labelText: formatCellValue(getResultValue(item, "Label")),
					parent: item,
					children: [],
					isSystemGroup: false,
				});
				return;
			}

			const parent =
				sameLabelItems.find((row) => getSubLabelText(row) === "") || sameLabelItems[0];
			const children = sameLabelItems.filter((row) => row.id !== parent.id);
			groups.push({
				groupKey: key,
				labelText: formatCellValue(getResultValue(parent, "Label")),
				parent,
				children,
				isSystemGroup: true,
			});
		});

		return groups;
	}, [tableData]);

	useEffect(() => {
		setCollapsedGroupMap((prev) => {
			const next: Record<string, boolean> = {};
			labelGroups.forEach((group) => {
				if (!group.isSystemGroup) return;
				next[group.groupKey] = prev[group.groupKey] ?? true;
			});
			return next;
		});
	}, [labelGroups]);

	const displayedItems = useMemo<DisplayRow[]>(() => {
		const keyword = searchValue.trim().toLowerCase();
		const hasKeyword = keyword.length > 0;
		const result: DisplayRow[] = [];

		labelGroups.forEach((group) => {
			const parentMatched =
				!hasKeyword || group.labelText.toLowerCase().includes(keyword);
			if (!group.isSystemGroup) {
				if (parentMatched) result.push(group.parent);
				return;
			}

			const visibleChildren = group.children.filter((child) => {
				const childLabel = formatCellValue(getResultValue(child, "Label")).toLowerCase();
				return !hasKeyword || childLabel.includes(keyword);
			});
			if (!parentMatched && visibleChildren.length === 0) return;

			result.push({
				...group.parent,
				__isSystemParent: true,
				__groupKey: group.groupKey,
			});

			const collapsed = collapsedGroupMap[group.groupKey] ?? true;
			if (!collapsed) {
				result.push(
					...visibleChildren.map((child) => ({
						...child,
						__isSystemChild: true,
						__groupKey: group.groupKey,
					})),
				);
			}
		});

		return result;
	}, [collapsedGroupMap, labelGroups, searchValue]);

	const hasSystemGroups = useMemo(
		() => labelGroups.some((group) => group.isSystemGroup),
		[labelGroups],
	);
	const allCollapsed = useMemo(() => {
		const systemGroups = labelGroups.filter((group) => group.isSystemGroup);
		if (systemGroups.length === 0) return false;
		return systemGroups.every((group) => collapsedGroupMap[group.groupKey] ?? false);
	}, [collapsedGroupMap, labelGroups]);

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
		selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
		onChange: (selectedKeys) => {
			const key = selectedKeys?.[0] as number | undefined;
			setSelectedRowKey(key ?? null);
		},
		columnWidth: 42,
	};

	const handleToggleShowCollapseAll = () => {
		setCollapsedGroupMap((prev) => {
			const next = { ...prev };
			labelGroups.forEach((group) => {
				if (!group.isSystemGroup) return;
				next[group.groupKey] = !allCollapsed;
			});
			return next;
		});
	};

	const generateUniqueCopyLabel = (originalLabel: string): string => {
		const allLabels = tableData.map((item) => {
			const label = getResultValue(item, "Label");
			return typeof label === "object"
				? JSON.stringify(label)
				: String(label ?? "").trim();
		});

		let newLabel = `${originalLabel} Copy`;
		if (!allLabels.includes(newLabel)) {
			return newLabel;
		}

		let counter = 1;
		while (allLabels.includes(`${originalLabel} Copy ${counter}`)) {
			counter++;
		}
		return `${originalLabel} Copy ${counter}`;
	};

	const handleCopyItem = async () => {
		if (!selectedRowKey) {
			notification.warning({
				message: "Warning",
				description: "Please select an item to copy",
			});
			return;
		}

		const selectedItem = tableData.find((item) => item.id === selectedRowKey);
		if (!selectedItem) {
			notification.warning({
				message: "Warning",
				description: "Selected item not found",
			});
			return;
		}

		const originalResult = parseItemResult(selectedItem.result);
		const originalLabel = String(originalResult["Label"] ?? "").trim();
		const newLabel = generateUniqueCopyLabel(originalLabel);

		const newResult = {
			...originalResult,
			Label: newLabel,
		};

		const requestBody = {
			take_off_id: takeoffId,
			single_file_merge_result_ids: "",
			take_off_result_item_ids: "",
			file_source_merge_result_ids: "",
			result: JSON.stringify(newResult),
			is_deleted: false,
			is_merged: false,
		};

		setCopyLoading(true);
		try {
			const response = await addTakeOffResultItem(requestBody);
			if (response.status === "success") {
				notification.success({
					message: "Success",
					description: "Item copied successfully",
				});
				setSelectedRowKey(null);
				await onRefreshItems?.();
			} else {
				notification.error({
					message: "Error",
					description: "Failed to copy item",
				});
			}
		} catch (error) {
			notification.error({
				message: "Error",
				description: "Failed to copy item",
			});
		} finally {
			setCopyLoading(false);
		}
	};

	const handleDeleteItem = (record: TakeoffItemRecord) => {
		Modal.confirm({
			title: "Delete Item",
			content: `Are you sure you want to delete this item: ${getResultValue(record, "Label")}?`,
			okText: "Delete",
			okButtonProps: { danger: true },
			cancelText: "Cancel",
			onOk: async () => {
				setDeleteLoading(true);
				try {
					const response = await deleteTakeOffResultItem(String(record.id));
					if (response.status === "success") {
						notification.success({
							message: "Success",
							description: "Item deleted successfully",
						});
						setTableData((prev) =>
							prev.filter((item) => item.id !== record.id),
						);
					} else {
						notification.error({
							message: "Error",
							description: "Failed to delete item",
						});
					}
				} catch (error) {
					notification.error({
						message: "Error",
						description: "Failed to delete item",
					});
				} finally {
					setDeleteLoading(false);
				}
			},
		});
	};

	const columns = useMemo<ColumnsType<TakeoffItemRecord>>(() => {
		const renderField = (record: TakeoffItemRecord, fieldName: string) => {
			const fieldValue = getResultValue(record, fieldName);
			const displayValue = formatDisplayValue(fieldValue);
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
								const normalizedNextValue = event.target.value.trim();

								if (normalizedOriginalValue === normalizedNextValue) {
									return;
								}

								// Check for duplicate Label
								if (fieldName === "Label") {
									const isDuplicate = tableData.some((item) => {
										if (item.id === record.id) return false;
										const itemLabel = getResultValue(item, "Label");
										const normalizedItemLabel =
											typeof itemLabel === "object"
												? JSON.stringify(itemLabel)
												: String(itemLabel ?? "").trim();
										return normalizedItemLabel === normalizedNextValue;
									});

									if (isDuplicate) {
										notification.warning({
											message: "Warning",
											description:
												"Label already exists, please enter a different value",
										});
										return;
									}
								}

								const originalResult = currentItem.result;
								const nextResultObject = {
									...parseItemResult(currentItem.result),
									[fieldName]: normalizedNextValue,
								};

								// Optimistically update UI
								setTableData((prev) => {
									return prev.map((item) => {
										if (item.id === record.id) {
											return {
												...item,
												result: nextResultObject,
											};
										}

										return item;
									});
								});

								// Call API
								const response = await updateTakeOffResultItem(
									String(record.id),
									{ result: nextResultObject },
								);

								if (response.status === "success") {
									if (fieldName === "Label") {
										onRefreshItems?.();
									}
									return;
								}

								// Rollback on failure
								setTableData((prev) => {
									return prev.map((item) => {
										if (item.id === record.id) {
											return {
												...item,
												result: originalResult,
											};
										}

										return item;
									});
								});

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
				const row = record as DisplayRow;
				if (!row.__isSystemParent || !row.__groupKey) {
					return renderField(record, "Label");
				}
				const isCollapsed = collapsedGroupMap[row.__groupKey] ?? true;
				return (
					<div className="relative w-full">
						<div>{renderField(record, "Label")}</div>
						<Button
							type="text"
							size="small"
							className="!absolute !right-0 !top-1/2 !h-5 !w-5 !min-w-5 !-translate-y-1/2 !p-0"
							onClick={(event) => {
								event.stopPropagation();
								const groupKey = row.__groupKey as string;
								setCollapsedGroupMap((prev) => ({
									...prev,
									[groupKey]: !(prev[groupKey] ?? true),
								}));
							}}
						>
							{isCollapsed ? (
								<DownOutlined className="text-[12px] text-grey-normal" />
							) : (
								<UpOutlined className="text-[12px] text-grey-normal" />
							)}
						</Button>
					</div>
				);
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
				const title = field?.name || "";

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
							className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${record?.is_checked
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
			title: (
				<div className="text-center text-xs text-grey-normal">Reference</div>
			),
			key: "evidences",
			width: 146,
			fixed: "right",
			align: "center",
			render: (_, record: any) => {
				const isNewItem = !record.single_file_merge_result_ids;

				return (
					<div className="flex items-center justify-center gap-2">
						<div className="w-[30px]">
							{isNewItem ? (
								<div></div>
							) : (
								<button
									type="button"
									className="flex h-6 items-center gap-1 px-2 text-[10px] transition-colors hover:opacity-70"
									onClick={(event) => {
										event.stopPropagation();
										onOpenReferencePanel(record);
									}}
									aria-label="Open reference panel"
								>
									<Image
										src="/assets/icons/file-refrence.svg"
										alt=""
										width={14}
										height={14}
									/>
								</button>
							)}
						</div>
						<Image
							src="/assets/icons/delete.svg"
							alt=""
							width={15}
							height={15}
							onClick={(event) => {
								event.stopPropagation();
								handleDeleteItem(record);
							}}
						/>
					</div>
				);
			},
		};

		return [
			labelColumn,
			...leftPinnedColumns,
			...regularColumns,
			//statusColumn,
			evidenceColumn,
		];
	}, [
		collapsedGroupMap,
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
						icon={<CopyOutlined />}
						loading={copyLoading}
						onClick={handleCopyItem}
					>
						Copy Item
					</Button>
					<Button
						className="rounded-full text-xs h-6 flex items-center gap-2 "
						disabled={!hasSystemGroups}
						onClick={handleToggleShowCollapseAll}
					>
						<p className="text-basicGray">
							{allCollapsed ? "Show All" : "Collapse All"}
						</p>
						<Image
							src={`/assets/icons/${allCollapsed ? "eye" : "eye-closed"}.svg`}
							alt="eye-closed icon"
							width={20}
							height={12}
						/>
					</Button>
				</div>
			</div>

			<div className="flex min-h-0 flex-1">
				<div className="min-h-0 flex-1 overflow-hidden">
					<Table<TakeoffItemRecord>
						rowKey={(record) => record?.id}
						rowSelection={rowSelection}
						loading={loading}
						columns={columns}
						dataSource={displayedItems}
						// 暂时取消分页，后续需求可能恢复。
						pagination={false}
						scroll={{ x: "max-content", y: "calc(100vh - 400px)" }}
						onRow={(record) => ({
							onClick: () => onSelectItem(record),
						})}
						rowClassName={(record) => {
							const row = record as DisplayRow;
							return `cursor-pointer ${row.__isSystemChild ? "[&>td]:!bg-[#F8FAFC]" : ""}`;
						}}
						className="h-full [&_.ant-pagination]:!m-0 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:!py-3 [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-pagination]:!border-t [&_.ant-table-pagination]:!border-primaryN30 [&_.ant-table-tbody>tr>td]:!py-3 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
						locale={{
							emptyText: (
								<div className="py-10 text-xs text-grey-normal">
									No items found for this file.
								</div>
							),
						}}
					/>
					<div className="pt-2 pr-1 text-right text-xs text-grey-normal">
						Total {items.length} items
					</div>
				</div>
			</div>
		</div>
	);
}
