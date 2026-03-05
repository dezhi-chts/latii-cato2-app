"use client";

import Button from "@/components/Button";
import { boxesColors } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import AddBoxTypeModal from "./Add-Box-Type-Modal";

import { useCompany } from "@/context/CompanyContext";
import { Input } from "antd";
import { deleteBoxType, getBoxTypes } from "@/services/drawingIndexService";

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

const BoxesType = () => {
  const { company } = useCompany();

  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Para detectar click afuera del menú (se lo asignamos SOLO al menú abierto)
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleAddModalCancel = () => setIsAddModalOpen(false);
  const handleOpenAddModal = () => setIsAddModalOpen(true);

  const handleOkAddModal = () => {
    console.log("ok add modal");
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

  // ✅ Cerrar menú al click afuera + ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!openMenuId) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openMenuId]);

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

  const handleDelete = async (boxId: number | string) => {
    if (!company?.id) return;

    setDeletingId(boxId);
    setOpenMenuId(null);

    const prev = boxes;
    setBoxes((cur) => cur.filter((b) => b.id !== boxId));

    try {
      await deleteBoxType(company.id, boxId);
    } catch (e) {
      console.error(e);
      // rollback si falla
      setBoxes(prev);
    } finally {
      setDeletingId(null);
    }
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
          filteredBoxes.map((box) => (
            <div
              key={`${box.id}-${box.name}`}
              className="w-full flex py-6 border-b border-primaryN30"
            >
              <div className="w-2/12 text-center">{box?.name ?? "-"}</div>

              <div className="w-1/12 flex justify-center items-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor:
                      boxesColors?.[box?.color as keyof typeof boxesColors] ??
                      "#A3A3A3",
                  }}
                />
              </div>

              <div className="w-4/12 px-2">{box?.search_prompt ?? ""}</div>

              <div className="w-5/12 px-2 flex justify-between items-center relative">
                <p className="w-11/12">{box?.analysis_prompt ?? ""}</p>

                <div
                  className="relative"
                  ref={openMenuId === box.id ? menuRef : null}
                >
                  {/* Trigger: puntitos */}
                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-primaryN20"
                    onClick={() =>
                      setOpenMenuId(openMenuId === box.id ? null : box.id)
                    }
                    aria-label="Open actions"
                  >
                    <Image
                      src="/assets/icons/three-dots.svg"
                      alt=""
                      width={60}
                      height={20}
                      className="opacity-80"
                    />
                  </button>

                  {/* Popover */}
                  {openMenuId === box.id && (
                    <div className="absolute right-0 top-11 bg-white border border-primaryN30 rounded-xl shadow-md flex items-center gap-2 px-2 py-1 z-10">
                      {/* Edit (ejemplo) */}
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-primaryN20 cursor-pointer"
                        aria-label="Edit"
                        onClick={() => {
                          // TODO: tu action edit
                          setOpenMenuId(null);
                        }}
                      >
                        <Image
                          src="/assets/icons/edit.svg"
                          alt=""
                          width={15}
                          height={15}
                        />
                      </button>

                      {/* Delete */}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoxesType;
