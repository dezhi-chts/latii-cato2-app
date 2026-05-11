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
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import Image from "next/image";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
	updateTakeOffResultItem,
	copyMultipleFilesMergeResultByIds,
	deleteTakeOffResultItemList,
} from "@/services/takeOffService";

import {
	formatCellValue,
	formatDisplayValue,
	getEvidenceIds,
	getResultValue,
	parseItemResult,
	setResultValueByField,
} from "../takeoffUtils";
import { TakeoffItemRecord, TemplateField } from "../types";
import { notify } from "@/utils/notify";

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
	const [sortState, setSortState] = useState<SortState>({
		field: null,
		order: null,
	});
	const selectedRowKeyRef = useRef<number | null>(null);

	useEffect(() => {
		setTableData(items);
	}, [items]);

	useEffect(() => {
		const nextSelectedId = selectedItemId ?? null;
		setSelectedRowKey(nextSelectedId);
		selectedRowKeyRef.current = nextSelectedId;
	}, [selectedItemId]);

	const normalizeLabel = (value: unknown) => formatCellValue(value).trim().toLowerCase();
	const getLabelKey = (item: TakeoffItemRecord) =>
		normalizeLabel(getResultValue(item, "Label"));
	const getSubLabelText = (item: TakeoffItemRecord) =>
		formatCellValue(getResultValue(item, "Sub Label")).trim();
	const getProductText = (item: TakeoffItemRecord) =>
		formatCellValue(getResultValue(item, "Product")).trim();

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

	type SortState = {
		field: string | null;
		order: SortOrder;
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

			const subLabelEmptyItems = sameLabelItems.filter(
				(row) => getSubLabelText(row) === "",
			);
			const parent =
				subLabelEmptyItems.length > 1
					? subLabelEmptyItems.find((row) => getProductText(row) === "") ||
					subLabelEmptyItems[0]
					: subLabelEmptyItems[0] || sameLabelItems[0];
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

	const compareByParentField = useMemo(
		() => (left: LabelGroup, right: LabelGroup, fieldName: string) => {
			const leftValue = formatCellValue(getResultValue(left.parent, fieldName)).trim();
			const rightValue = formatCellValue(getResultValue(right.parent, fieldName)).trim();
			const leftNumber = Number(leftValue.replace(/,/g, ""));
			const rightNumber = Number(rightValue.replace(/,/g, ""));
			const leftIsNumber = leftValue !== "" && Number.isFinite(leftNumber);
			const rightIsNumber = rightValue !== "" && Number.isFinite(rightNumber);

			if (leftIsNumber && rightIsNumber) {
				return leftNumber - rightNumber;
			}
			return leftValue.localeCompare(rightValue, undefined, {
				sensitivity: "base",
				numeric: true,
			});
		},
		[],
	);

	const sortedLabelGroups = useMemo(() => {
		if (!sortState.field || !sortState.order) {
			return labelGroups;
		}
		const direction = sortState.order === "ascend" ? 1 : -1;
		return [...labelGroups].sort((left, right) => {
			return compareByParentField(left, right, sortState.field!) * direction;
		});
	}, [compareByParentField, labelGroups, sortState.field, sortState.order]);

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

		sortedLabelGroups.forEach((group) => {
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
	}, [collapsedGroupMap, searchValue, sortedLabelGroups]);

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
		onChange: (_selectedKeys, selectedRows) => {
			const row = selectedRows?.[0];
			if (!row) {
				setSelectedRowKey(null);
				selectedRowKeyRef.current = null;
				return;
			}

			const nextId = row.id;
			if (selectedRowKeyRef.current === nextId) {
				return;
			}

			selectedRowKeyRef.current = nextId;
			setSelectedRowKey(nextId);
			onSelectItem(row);
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
			notify.warning({
				title: "Warning",
				description: "Please select an item to copy",
			});
			return;
		}

		const selectedItem = tableData.find((item) => item.id === selectedRowKey);
		if (!selectedItem) {
			notify.warning({
				title: "Warning",
				description: "Selected item not found",
			});
			return;
		}

		const originalResult = parseItemResult(
			(selectedItem as any).originalResult ?? selectedItem.result,
		);

		const originalLabel = String(originalResult["Label"] ?? "").trim();
		const newLabel = generateUniqueCopyLabel(originalLabel);

		setCopyLoading(true);
		try {
			const response = await copyMultipleFilesMergeResultByIds(
				takeoffId,
				String(selectedItem.id),
			);
			if (response.status === "success") {
				notify.success({
					title: "Success",
					description: "Item copied successfully",
				});
				setSelectedRowKey(null);
				await onRefreshItems?.();
			} else {
				notify.error({
					title: "Error",
					description: response?.data?.detail || "Failed to copy item",
				});
			}
		} catch (error: any) {
			notify.error({
				title: "Error",
				description: error?.message || "Failed to copy item",
			});
		} finally {
			setCopyLoading(false);
		}
	};

	const handleDeleteItem = (record: TakeoffItemRecord) => {
		const displayRecord = record as DisplayRow;
		const group = displayRecord.__groupKey
			? labelGroups.find((item) => item.groupKey === displayRecord.__groupKey)
			: null;
		const deleteIds =
			displayRecord.__isSystemParent && group
				? [group.parent.id, ...group.children.map((child) => child.id)]
				: [record.id];
		const resultIds = deleteIds
			.map((id) => String(id))
			.filter((id) => id.trim().length > 0)
			.join(",");

		Modal.confirm({
			title: "Delete Item",
			content: `Are you sure you want to delete this item: ${getResultValue(record, "Label")}?`,
			okText: "Delete",
			okButtonProps: { danger: true },
			cancelText: "Cancel",
			onOk: async () => {
				if (!resultIds) {
					notify.error({
						title: "Error",
						description: "No valid item ids found for deletion",
					});
					return;
				}
				setDeleteLoading(true);
				try {
					const response = await deleteTakeOffResultItemList(resultIds);
					if (response.status === "success") {
						notify.success({
							title: "Success",
							description: "Item deleted successfully",
						});
						setTableData((prev) =>
							prev.filter((item) => !deleteIds.includes(item.id)),
						);
						await onRefreshItems?.();
					} else {
						notify.error({
							title: "Error",
							description: response?.data?.detail || "Failed to delete item",
						});
					}
				} catch (error: any) {
					notify.error({
						title: "Error",
						description: error?.message || "Failed to delete item",
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
										notify.warning({
											title: "Warning",
											description:
												"Label already exists, please enter a different value",
										});
										return;
									}
								}

								const originalResult = parseItemResult(
									(currentItem as any).originalResult ?? currentItem.result,
								);
								const nextResultObject = setResultValueByField(
									originalResult,
									fieldName,
									normalizedNextValue,
								);

								// Optimistically update UI
								setTableData((prev) => {
									return prev.map((item) => {
										if (item.id === record.id) {
											return {
												...item,
												result: nextResultObject,
												originalResult: nextResultObject,
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
												originalResult,
											};
										}

										return item;
									});
								});

								notify.error({
									title: "Error",
									description: response?.data?.detail || "Failed to update field",
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
			minWidth: 140,
			fixed: "left",
			align: "center",
			sorter: true,
			sortOrder: sortState.field === "Label" ? sortState.order : null,
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
					sorter: true,
					sortOrder: sortState.field === field?.name ? sortState.order : null,
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
		sortState.field,
		sortState.order,
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
						scroll={{ x: "max-content", y: "calc(100vh - 300px)" }}
						onChange={(_, __, sorter) => {
							const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
							const nextField =
								(nextSorter?.columnKey as string) || (nextSorter?.field as string) || null;
							setSortState({
								field: nextField,
								order: nextSorter?.order || null,
							});
						}}
						onRow={(record) => ({
							onClick: () => {
								if (selectedRowKeyRef.current === record.id) {
									return;
								}
								selectedRowKeyRef.current = record.id;
								setSelectedRowKey(record.id);
								onSelectItem(record);
							},
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
