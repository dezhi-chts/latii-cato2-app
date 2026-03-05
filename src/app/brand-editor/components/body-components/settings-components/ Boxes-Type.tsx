"use client";

import Button from "@/components/Button";
import { boxesColors } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import AddBoxTypeModal from "./Add-Box-Type-Modal";
import { useCompany } from "@/context/CompanyContext";
import { Input } from "antd";
import {
  createBoxType,
  deleteBoxType,
  getBoxTypes,
  updateBoxType,
} from "@/services/drawingIndexService";

type BoxType = {
  id: number | string;
  name: string;
  description?: string;
  color?: keyof typeof boxesColors | string;
  search_prompt?: string;
  analysis_prompt?: string;
  is_deleted?: boolean;
  create_time?: string;
  update_time?: string;
  update_user?: string;
  create_user?: string;
};

type EditingDraft = {
  name: string;
  description: string;
  color: string;
  search_prompt: string;
  analysis_prompt: string;
};

const colorOptions = Object.keys(boxesColors) as (keyof typeof boxesColors)[];

const BoxesType = () => {
  const { company } = useCompany();

  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Menú 3 puntitos
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  // Menú colores (por fila)
  const [openColorId, setOpenColorId] = useState<number | string | null>(null);

  // Delete / Update loading
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<EditingDraft | null>(null);

  // Refs para click-afueras (asignamos solo al menú abierto)
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const colorsRef = useRef<HTMLDivElement | null>(null);

  // Para evitar doble update si blur/disparos rápidos
  const lastUpdateKeyRef = useRef<string>("");

  const handleAddModalCancel = () => setIsAddModalOpen(false);
  const handleOpenAddModal = () => setIsAddModalOpen(true);

  const handleOkAddModal = async (data: {
    name: string;
    description: string;
    color: string;
    search_prompt: string;
    analysis_prompt: string;
  }) => {
    if (!company?.id) return;

    const res = await createBoxType(company.id.toString(), data);

    if (res?.status === "success") {
      setIsAddModalOpen(false);
      await fetchBoxes();
    } else {
      console.error("Create box type failed:", res?.data);
      // si después querés, lo mostramos lindo en UI
    }
  };

  const fetchBoxes = async () => {
    if (!company?.id) return;

    setIsLoading(true);
    try {
      const res = await getBoxTypes(company.id.toString());
      const data = (res as any)?.data ?? [];
      setBoxes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBoxes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // ✅ Cerrar menús al click afuera + ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;

      if (
        openMenuId &&
        actionsRef.current &&
        !actionsRef.current.contains(target)
      ) {
        setOpenMenuId(null);
      }

      if (
        openColorId &&
        colorsRef.current &&
        !colorsRef.current.contains(target)
      ) {
        setOpenColorId(null);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setOpenColorId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openMenuId, openColorId]);

  const filteredBoxes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boxes;

    return boxes.filter((b) => {
      const name = b?.name?.toLowerCase() ?? "";
      const sp = b?.search_prompt?.toLowerCase() ?? "";
      const ap = b?.analysis_prompt?.toLowerCase() ?? "";
      return name.includes(q) || sp.includes(q) || ap.includes(q);
    });
  }, [boxes, search]);

  // ✅ Mejora 1: delete snapshot correcto (sin stale)
  const handleDelete = async (boxId: number | string) => {
    if (!company?.id) return;

    setDeletingId(boxId);
    setOpenMenuId(null);

    let prevSnapshot: BoxType[] = [];

    setBoxes((cur) => {
      prevSnapshot = cur;
      return cur.filter((b) => b.id !== boxId);
    });

    try {
      await deleteBoxType(company.id, boxId);
      // ✅ Mejora 2 opcional: sync con backend
      // await fetchBoxes();
    } catch (e) {
      console.error(e);
      setBoxes(prevSnapshot);
    } finally {
      setDeletingId(null);
    }
  };

  const startEditRow = (box: BoxType) => {
    setOpenMenuId(null);
    setOpenColorId(null);
    setEditingId(box.id);

    setDraft({
      name: box?.name ?? "",
      description: box?.description ?? "",
      color: (box?.color as string) ?? "",
      search_prompt: box?.search_prompt ?? "",
      analysis_prompt: box?.analysis_prompt ?? "",
    });
  };

  const stopEditRow = () => {
    setEditingId(null);
    setDraft(null);
    setOpenColorId(null);
  };

  const commitUpdate = async (boxId: number | string, next: EditingDraft) => {
    if (!company?.id) return;

    // evita calls idénticas seguidas
    const key = `${boxId}|${JSON.stringify(next)}`;
    if (lastUpdateKeyRef.current === key) return;
    lastUpdateKeyRef.current = key;

    setUpdatingId(boxId);

    // optimistic update de UI (solo en esa fila)
    const prevSnapshot = boxes;
    setBoxes((cur) => cur.map((b) => (b.id === boxId ? { ...b, ...next } : b)));

    try {
      const res = await updateBoxType(
        company.id.toString(),
        boxId.toString(),
        next
      );

      if (res?.status !== "success") {
        setBoxes(prevSnapshot);
      } else {
        // opcional: sync si querés estar 100% con backend
        // await fetchBoxes();
      }
    } catch (e) {
      console.error(e);
      setBoxes(prevSnapshot);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlurField = async (boxId: number | string) => {
    if (!draft) return;
    await commitUpdate(boxId, draft);
  };

  const handleKeyDownEdit = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    boxId: number | string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (draft) {
        await commitUpdate(boxId, draft);
      }
      stopEditRow();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      stopEditRow();
    }
  };

  const handlePickColor = async (boxId: number | string, color: string) => {
    if (!draft) return;

    const next = { ...draft, color };
    setDraft(next);
    setOpenColorId(null);

    await commitUpdate(boxId, next);
  };

  return (
    <div className="w-full h-full text-xs pr-20 pb-10">
      <AddBoxTypeModal
        isOpen={isAddModalOpen}
        handleCancel={handleAddModalCancel}
        onOk={handleOkAddModal}
      />

      {/* titles */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-base text-grey-base-dark">Box Information</p>
          <p className="text-grey-normal">
            This is the box information available for all takeoffs. Create up to
            20 options.
          </p>
        </div>

        <Button
          backgroundColor="forumBlue-normal"
          className="rounded-md"
          onClick={handleOpenAddModal}
        >
          + Add Box Type
        </Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[400px] w-[20vw] rounded-xl"
          allowClear
          prefix={
            <Image
              src="/assets/icons/search.svg"
              alt="Search"
              width={12}
              height={12}
            />
          }
        />
      </div>

      <div className="w-full">
        {/* encabezados */}
        <div className="w-full flex bg-primaryN20 border-b border-b-primaryN30 text-grey-normal py-3 rounded-t-md">
          <div className="w-2/12 text-center">Logic Name</div>
          <div className="w-1/12 text-center">Color</div>
          <div className="w-4/12 text-center">Search Prompt</div>
          <div className="w-5/12 text-center">Analysis Prompt</div>
        </div>

        {/* contenido */}
        {isLoading ? (
          <div className="py-6 text-grey-normal text-center">
            Loading box types...
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div className="py-6 text-grey-normal text-center">
            No box types found.
          </div>
        ) : (
          filteredBoxes.map((box) => {
            const isEditing = editingId === box.id;
            const isUpdating = updatingId === box.id;

            return (
              <div
                key={`${box.id}-${box.name}`}
                className="w-full flex py-6 border-b border-primaryN30"
              >
                {/* Name */}
                <div className="w-2/12 px-2 flex items-center justify-center">
                  {isEditing ? (
                    <Input
                      size="small"
                      value={draft?.name ?? ""}
                      onKeyDown={(e) => handleKeyDownEdit(e, box.id)}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, name: e.target.value } : d
                        )
                      }
                      onBlur={() => handleBlurField(box.id)}
                    />
                  ) : (
                    <span className="text-center">{box?.name ?? "-"}</span>
                  )}
                </div>

                {/* Color */}
                <div className="w-1/12 flex justify-center items-center">
                  {isEditing ? (
                    <div
                      className="relative"
                      ref={openColorId === box.id ? colorsRef : null}
                    >
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-primaryN20"
                        onClick={() =>
                          setOpenColorId(openColorId === box.id ? null : box.id)
                        }
                        aria-label="Pick color"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor:
                              boxesColors?.[
                                (draft?.color as keyof typeof boxesColors) ??
                                  (box?.color as keyof typeof boxesColors)
                              ] ?? "#A3A3A3",
                          }}
                        />
                      </button>

                      {openColorId === box.id && (
                        <div className="absolute right-0 top-11 bg-white border border-primaryN30 rounded-xl shadow-md z-10 p-2 flex flex-wrap gap-2 w-[160px]">
                          {colorOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              title={c}
                              className="w-9 h-9 rounded-xl hover:bg-primaryN20 flex items-center justify-center"
                              onClick={() => handlePickColor(box.id, c)}
                            >
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: boxesColors[c] }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          boxesColors?.[
                            box?.color as keyof typeof boxesColors
                          ] ?? "#A3A3A3",
                      }}
                    />
                  )}
                </div>

                {/* Search Prompt */}
                <div className="w-4/12 px-2 flex items-center">
                  {isEditing ? (
                    <Input
                      size="small"
                      value={draft?.search_prompt ?? ""}
                      onKeyDown={(e) => handleKeyDownEdit(e, box.id)}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, search_prompt: e.target.value } : d
                        )
                      }
                      onBlur={() => handleBlurField(box.id)}
                    />
                  ) : (
                    <span>{box?.search_prompt ?? ""}</span>
                  )}
                </div>

                {/* Analysis Prompt + actions */}
                <div className="w-5/12 px-2 flex justify-between items-center relative">
                  <div className="w-11/12">
                    {isEditing ? (
                      <Input
                        size="small"
                        value={draft?.analysis_prompt ?? ""}
                        onKeyDown={(e) => handleKeyDownEdit(e, box.id)}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, analysis_prompt: e.target.value } : d
                          )
                        }
                        onBlur={() => handleBlurField(box.id)}
                      />
                    ) : (
                      <p>{box?.analysis_prompt ?? ""}</p>
                    )}
                  </div>

                  {/* actions menu */}
                  <div
                    className="relative"
                    ref={openMenuId === box.id ? actionsRef : null}
                  >
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-primaryN20"
                      onClick={() =>
                        setOpenMenuId(openMenuId === box.id ? null : box.id)
                      }
                      aria-label="Open actions"
                      disabled={isUpdating || deletingId === box.id}
                    >
                      <Image
                        src="/assets/icons/three-dots.svg"
                        alt=""
                        width={60}
                        height={20}
                        className="opacity-80"
                      />
                    </button>

                    {openMenuId === box.id && (
                      <div className="absolute right-0 top-11 bg-white border border-primaryN30 rounded-xl shadow-md flex items-center gap-2 px-2 py-1 z-10">
                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-primaryN20 cursor-pointer"
                          aria-label="Edit"
                          onClick={() => startEditRow(box)}
                        >
                          <Image
                            src="/assets/icons/edit.svg"
                            alt=""
                            width={15}
                            height={15}
                          />
                        </button>

                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-primaryN20 cursor-pointer disabled:opacity-50"
                          aria-label="Delete"
                          disabled={deletingId === box.id}
                          onClick={() => handleDelete(box.id)}
                        >
                          <Image
                            src="/assets/icons/delete.svg"
                            alt=""
                            width={15}
                            height={15}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* mini feedback opcional */}
                {isEditing && (
                  <button
                    type="button"
                    className="hidden"
                    onClick={stopEditRow}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BoxesType;
