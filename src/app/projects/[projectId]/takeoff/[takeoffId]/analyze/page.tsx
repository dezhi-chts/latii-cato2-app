"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  ConfigProvider,
  Divider,
  Popover,
  Select,
  notification,
} from "antd";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { getTakeOffsDetails } from "@/services/takeOffService";
import { getEvidenceByFileId } from "@/services/evidenceService";
import { fetchProject } from "@/services/projectService";

import Header from "./components/Header";
import ItemsTable from "./components/ItemsTable";
import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";
import { getTakeOffResult } from "@/services/DrawingAiService";
import NewItemsTable from "./components/NewItemsTable";

export type PageData = {
  current: number;
  total: number;
};

const Analyze = () => {
  const order = Number(useParams().projectId);
  const takeOffId = useParams().takeoffId;
  const searchParams = useSearchParams();
  const projectId = searchParams.get("_pId") || "";
  const pdfRef = useRef<{
    handleSend: () => void;
    getPageAmount: () => number;
    resetAllInfo: () => void;
    rotatePDF: () => void;
  }>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(0);
  const [takeOff, setTakeOff] = useState<any>({
    take_off_result: {
      id: 129,
      name: "2025/11/13-18:22:58",
      project_id: "01K9WNZ0MJDSY2HM747NFAGEST",
      project_file_ids: "428",
      template_id: 1,
      status: 2,
      status_desc: "Analyzed",
      hinge_status: 1,
      country_of_origin: "United States",
      create_time: "2025-11-13T18:22:58",
      update_time: "2025-11-14T13:37:46",
      create_user: "flor@latii.com",
      update_user: "flor@latii.com",
    },
    all_items: {
      "428": [
        {
          sequence_number: 1,
          id: 2613,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-CE-001", "Product": "Door", "Width": 196.8503937007874, "Height": 94.48818897637796, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 2,
          id: 2614,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-CE-002", "Product": "Door", "Width": 246.06299212598427, "Height": 103.1496062992126, "Width_mm": 6250, "Height_mm": 2620, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 3,
          id: 2615,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-CE-003", "Product": "Door", "Width": 255.9055118110236, "Height": 147.63779527559055, "Width_mm": 6500, "Height_mm": 3750, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 4,
          id: 2616,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-CE-004", "Product": "Door", "Width": 419.29133858267716, "Height": 137.79527559055117, "Width_mm": 10650, "Height_mm": 3500, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 5,
          id: 2617,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001", "Product": "Door", "Width": 283.46456692913387, "Height": 94.48818897637796, "Width_mm": 7200, "Height_mm": 2400, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 6,
          id: 2699,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T16:44:55",
          result:
            '{"Label":"014-PA-001_1","Product":"Door","Product Type":"Direct Set / Picture / Fixed, new values. test new value","Operability":"None","Width":39.3701,"Height":94.48824,"Width_mm":1000,"Height_mm":2400,"Quantity":1,"Source Type":"Image"}',
        },
        {
          sequence_number: 7,
          id: 2700,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_2", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 39.3701, "Height": 94.48824, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 8,
          id: 2701,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_3", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 22.440957, "Height": 94.48824, "Width_mm": 570, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 9,
          id: 2702,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_4", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 39.3701, "Height": 94.48824, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 10,
          id: 2703,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_5", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 39.3701, "Height": 94.48824, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 11,
          id: 2704,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_6", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 22.440957, "Height": 94.48824, "Width_mm": 570, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 12,
          id: 2705,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_7", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 39.3701, "Height": 94.48824, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 13,
          id: 2706,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-001_8", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 39.3701, "Height": 94.48824, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 14,
          id: 2618,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-002", "Product": "Door", "Width": 53.14960629921259, "Height": 113.38582677165354, "Width_mm": 1350, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 15,
          id: 2708,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-002_B", "Product": "Door", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 53.149635, "Height": 113.385888, "Width_mm": 1350, "Height_mm": 2880, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 16,
          id: 2707,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 754,
          evidence_ids: "[754]",
          evidence_id_list: [754],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PA-002_T", "Product": "Window", "Product Type": "Direct Set / Picture / Fixed", "Operability": "None", "Width": 53.149635, "Height": 23.62206, "Width_mm": 1350, "Height_mm": 600, "Quantity": 1, "Source Type": "Image"}',
        },
        {
          sequence_number: 17,
          id: 2623,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-001", "Product": "Door", "Width": 196.8503937007874, "Height": 94.48818897637796, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 18,
          id: 2625,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-002", "Product": "Door", "Width": 78.74015748031496, "Height": 94.48818897637796, "Width_mm": 2000, "Height_mm": 2400, "Quantity": 9, "Source Type": "Table"}',
        },
        {
          sequence_number: 19,
          id: 2624,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-003", "Product": "Door", "Width": 70.86614173228347, "Height": 94.48818897637796, "Width_mm": 1800, "Height_mm": 2400, "Quantity": 5, "Source Type": "Table"}',
        },
        {
          sequence_number: 20,
          id: 2626,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-003", "Product": "Door", "Width": 70.86614173228347, "Height": 113.38582677165354, "Width_mm": 1800, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 21,
          id: 2627,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-004", "Product": "Door", "Width": 82.67716535433071, "Height": 113.38582677165354, "Width_mm": 2100, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 22,
          id: 2628,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PE-005", "Product": "Door", "Width": 196.8503937007874, "Height": 113.38582677165354, "Width_mm": 5000, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 23,
          id: 2646,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PF-001", "Product": "Door", "Width": 185.03937007874015, "Height": 92.51968503937007, "Width_mm": 4700, "Height_mm": 2350, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 24,
          id: 2647,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PF-002", "Product": "Door", "Width": 275.59055118110234, "Height": 92.51968503937007, "Width_mm": 7000, "Height_mm": 2350, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 25,
          id: 2630,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PF-003", "Product": "Door", "Width": 185.03937007874015, "Height": 140.9448818897638, "Width_mm": 4700, "Height_mm": 3580, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 26,
          id: 2631,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PF-003_1", "Product": "Door", "Width": 185.03937007874015, "Height": 140.9448818897638, "Width_mm": 4700, "Height_mm": 3580, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 27,
          id: 2629,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PF-004", "Product": "Door", "Width": 275.59055118110234, "Height": 140.9448818897638, "Width_mm": 7000, "Height_mm": 3580, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 28,
          id: 2632,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-001", "Product": "Door", "Width": 48.4251968503937, "Height": 94.48818897637796, "Width_mm": 1230, "Height_mm": 2400, "Quantity": 9, "Source Type": "Table"}',
        },
        {
          sequence_number: 29,
          id: 2633,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-002", "Product": "Door", "Width": 47.24409448818898, "Height": 113.38582677165354, "Width_mm": 1200, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 30,
          id: 2634,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-003", "Product": "Door", "Width": 97.24409448818898, "Height": 113.38582677165354, "Width_mm": 2470, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 31,
          id: 2635,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-004", "Product": "Door", "Width": 144.48818897637796, "Height": 113.38582677165354, "Width_mm": 3670, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 32,
          id: 2636,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-005", "Product": "Door", "Width": 144.48818897637796, "Height": 113.38582677165354, "Width_mm": 3670, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 33,
          id: 2637,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-006", "Product": "Door", "Width": 144.48818897637796, "Height": 113.38582677165354, "Width_mm": 3670, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 34,
          id: 2638,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-007", "Product": "Door", "Width": 191.73228346456693, "Height": 113.38582677165354, "Width_mm": 4870, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 35,
          id: 2639,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-008", "Product": "Door", "Width": 238.9763779527559, "Height": 113.38582677165354, "Width_mm": 6070, "Height_mm": 2880, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 36,
          id: 2640,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-009", "Product": "Door", "Width": 238.9763779527559, "Height": 113.38582677165354, "Width_mm": 6070, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 37,
          id: 2641,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-010", "Product": "Door", "Width": 286.2204724409449, "Height": 118.11023622047244, "Width_mm": 7270, "Height_mm": 3000, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 38,
          id: 2642,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-011", "Product": "Door", "Width": 48.4251968503937, "Height": 94.48818897637796, "Width_mm": 1230, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 39,
          id: 2643,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-012", "Product": "Door", "Width": 39.37007874015748, "Height": 94.48818897637796, "Width_mm": 1000, "Height_mm": 2400, "Quantity": 7, "Source Type": "Table"}',
        },
        {
          sequence_number: 40,
          id: 2644,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-013", "Product": "Door", "Width": 97.24409448818898, "Height": 137.79527559055117, "Width_mm": 2470, "Height_mm": 3500, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 41,
          id: 2645,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-PM-013_1", "Product": "Door", "Width": 97.24409448818898, "Height": 113.38582677165354, "Width_mm": 2470, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 42,
          id: 2649,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-001", "Product": "Window", "Width": 23.62204724409449, "Height": 70.86614173228347, "Width_mm": 600, "Height_mm": 1800, "Quantity": 72, "Source Type": "Table"}',
        },
        {
          sequence_number: 43,
          id: 2648,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-001\'", "Product": "Window", "Width": 23.62204724409449, "Height": 62.99212598425197, "Width_mm": 600, "Height_mm": 1600, "Quantity": 16, "Source Type": "Table"}',
        },
        {
          sequence_number: 44,
          id: 2650,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-002", "Product": "Door", "Width": 97.24409448818898, "Height": 94.48818897637796, "Width_mm": 2470, "Height_mm": 2400, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 45,
          id: 2651,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-003", "Product": "Door", "Width": 122.04724409448819, "Height": 94.48818897637796, "Width_mm": 3100, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 46,
          id: 2653,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-004", "Product": "Door", "Width": 118.11023622047244, "Height": 94.48818897637796, "Width_mm": 3000, "Height_mm": 2400, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 47,
          id: 2652,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-004b", "Product": "Door", "Width": 104.33070866141732, "Height": 94.48818897637796, "Width_mm": 2650, "Height_mm": 2400, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 48,
          id: 2654,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-005", "Product": "Door", "Width": 190.9448818897638, "Height": 94.48818897637796, "Width_mm": 4850, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 49,
          id: 2655,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-006", "Product": "Door", "Width": 263.7795275590551, "Height": 94.48818897637796, "Width_mm": 6700, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 50,
          id: 2656,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-007", "Product": "Door", "Width": 196.8503937007874, "Height": 94.48818897637796, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 51,
          id: 2657,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-008", "Product": "Door", "Width": 196.8503937007874, "Height": 94.48818897637796, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 6, "Source Type": "Table"}',
        },
        {
          sequence_number: 52,
          id: 2658,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-009", "Product": "Door", "Width": 206.2992125984252, "Height": 94.48818897637796, "Width_mm": 5240, "Height_mm": 2400, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 53,
          id: 2659,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-010", "Product": "Door", "Width": 196.8503937007874, "Height": 94.48818897637796, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 54,
          id: 2660,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-011", "Product": "Door", "Width": 283.46456692913387, "Height": 94.48818897637796, "Width_mm": 7200, "Height_mm": 2400, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 55,
          id: 2661,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VF-012", "Product": "Door", "Width": 311.0236220472441, "Height": 94.48818897637796, "Width_mm": 7900, "Height_mm": 2400, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 56,
          id: 2662,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-001", "Product": "Window", "Width": 50.0, "Height": 23.62204724409449, "Width_mm": 1270, "Height_mm": 600, "Quantity": 6, "Source Type": "Table"}',
        },
        {
          sequence_number: 57,
          id: 2663,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-002", "Product": "Window", "Width": 144.48818897637796, "Height": 24.01574803149606, "Width_mm": 3670, "Height_mm": 610, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 58,
          id: 2665,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-003", "Product": "Window", "Width": 238.9763779527559, "Height": 24.01574803149606, "Width_mm": 6070, "Height_mm": 610, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 59,
          id: 2666,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-004", "Product": "Window", "Width": 286.2204724409449, "Height": 24.01574803149606, "Width_mm": 7270, "Height_mm": 610, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 60,
          id: 2667,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-005", "Product": "Window", "Width": 191.73228346456693, "Height": 47.24409448818898, "Width_mm": 4870, "Height_mm": 1200, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 61,
          id: 2668,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-006", "Product": "Window", "Width": 238.9763779527559, "Height": 47.24409448818898, "Width_mm": 6070, "Height_mm": 1200, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 62,
          id: 2669,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-007", "Product": "Window", "Width": 97.24409448818898, "Height": 57.48031496062992, "Width_mm": 2470, "Height_mm": 1460, "Quantity": 7, "Source Type": "Table"}',
        },
        {
          sequence_number: 63,
          id: 2670,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-008", "Product": "Window", "Width": 144.48818897637796, "Height": 57.48031496062992, "Width_mm": 3670, "Height_mm": 1460, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 64,
          id: 2671,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-009", "Product": "Window", "Width": 238.9763779527559, "Height": 57.48031496062992, "Width_mm": 6070, "Height_mm": 1460, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 65,
          id: 2672,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-010", "Product": "Window", "Width": 286.2204724409449, "Height": 57.48031496062992, "Width_mm": 7270, "Height_mm": 1460, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 66,
          id: 2673,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-011", "Product": "Window", "Width": 50.0, "Height": 70.86614173228347, "Width_mm": 1270, "Height_mm": 1800, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 67,
          id: 2674,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-012", "Product": "Window", "Width": 144.48818897637796, "Height": 70.86614173228347, "Width_mm": 3670, "Height_mm": 1800, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 68,
          id: 2675,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-013", "Product": "Window", "Width": 191.73228346456693, "Height": 70.86614173228347, "Width_mm": 4870, "Height_mm": 1800, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 69,
          id: 2676,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-014", "Product": "Window", "Width": 238.9763779527559, "Height": 70.86614173228347, "Width_mm": 6070, "Height_mm": 1800, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 70,
          id: 2677,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-015", "Product": "Door", "Width": 97.24409448818898, "Height": 94.48818897637796, "Width_mm": 2470, "Height_mm": 2400, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 71,
          id: 2678,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-016", "Product": "Door", "Width": 144.48818897637796, "Height": 94.48818897637796, "Width_mm": 3670, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 72,
          id: 2679,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-017", "Product": "Door", "Width": 191.73228346456693, "Height": 113.38582677165354, "Width_mm": 4870, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 73,
          id: 2680,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-018", "Product": "Door", "Width": 238.9763779527559, "Height": 113.38582677165354, "Width_mm": 6070, "Height_mm": 2880, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 74,
          id: 2681,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-019", "Product": "Door", "Width": 238.9763779527559, "Height": 94.48818897637796, "Width_mm": 6070, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 75,
          id: 2682,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-020", "Product": "Door", "Width": 286.2204724409449, "Height": 94.48818897637796, "Width_mm": 7270, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 76,
          id: 2683,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-021", "Product": "Door", "Width": 286.2204724409449, "Height": 113.38582677165354, "Width_mm": 7270, "Height_mm": 2880, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 77,
          id: 2684,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-022", "Product": "Door", "Width": 286.2204724409449, "Height": 94.48818897637796, "Width_mm": 7270, "Height_mm": 2400, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 78,
          id: 2685,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-023", "Product": "Door", "Width": 238.9763779527559, "Height": 118.11023622047244, "Width_mm": 6070, "Height_mm": 3000, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 79,
          id: 2686,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-024", "Product": "Window", "Width": 97.24409448818898, "Height": 66.92913385826772, "Width_mm": 2470, "Height_mm": 1700, "Quantity": 12, "Source Type": "Table"}',
        },
        {
          sequence_number: 80,
          id: 2687,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-025", "Product": "Window", "Width": 144.48818897637796, "Height": 66.92913385826772, "Width_mm": 3670, "Height_mm": 1700, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 81,
          id: 2688,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-026", "Product": "Window", "Width": 191.73228346456693, "Height": 66.92913385826772, "Width_mm": 4870, "Height_mm": 1700, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 82,
          id: 2689,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-027", "Product": "Window", "Width": 238.9763779527559, "Height": 66.92913385826772, "Width_mm": 6070, "Height_mm": 1700, "Quantity": 18, "Source Type": "Table"}',
        },
        {
          sequence_number: 83,
          id: 2690,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-028", "Product": "Window", "Width": 286.2204724409449, "Height": 66.92913385826772, "Width_mm": 7270, "Height_mm": 1700, "Quantity": 28, "Source Type": "Table"}',
        },
        {
          sequence_number: 84,
          id: 2691,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-029", "Product": "Window", "Width": 191.73228346456693, "Height": 74.80314960629921, "Width_mm": 4870, "Height_mm": 1900, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 85,
          id: 2692,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-030", "Product": "Window", "Width": 238.9763779527559, "Height": 74.80314960629921, "Width_mm": 6070, "Height_mm": 1900, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 86,
          id: 2693,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-031", "Product": "Door", "Width": 191.73228346456693, "Height": 94.48818897637796, "Width_mm": 4870, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 87,
          id: 2664,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "014-VM-032", "Product": "Window", "Width": 191.73228346456693, "Height": 24.01574803149606, "Width_mm": 4870, "Height_mm": 610, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 88,
          id: 2621,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-CF-08", "Product": "Door", "Width": 36.22047244094488, "Height": 94.48818897637796, "Width_mm": 920, "Height_mm": 2400, "Quantity": 28, "Source Type": "Table"}',
        },
        {
          sequence_number: 89,
          id: 2622,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-CF-30", "Product": "Door", "Width": 32.28346456692913, "Height": 94.48818897637796, "Width_mm": 820, "Height_mm": 2400, "Quantity": 11, "Source Type": "Table"}',
        },
        {
          sequence_number: 90,
          id: 2619,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-CF-32", "Product": "Door", "Width": 44.09448818897638, "Height": 94.48818897637796, "Width_mm": 1120, "Height_mm": 2400, "Quantity": 5, "Source Type": "Table"}',
        },
        {
          sequence_number: 91,
          id: 2694,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-MC-001", "Product": "Door", "Width": 27913.38582677165, "Height": 415.748031496063, "Width_mm": 709000, "Height_mm": 10560, "Quantity": 2, "Source Type": "Table"}',
        },
        {
          sequence_number: 92,
          id: 2695,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-MC-002", "Product": "Door", "Width": 27913.38582677165, "Height": 415.748031496063, "Width_mm": 709000, "Height_mm": 10560, "Quantity": 4, "Source Type": "Table"}',
        },
        {
          sequence_number: 93,
          id: 2696,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-MC-003", "Product": "Door", "Width": 8740.15748031496, "Height": 255.11811023622047, "Width_mm": 222000, "Height_mm": 6480, "Quantity": 3, "Source Type": "Table"}',
        },
        {
          sequence_number: 94,
          id: 2697,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-MC-004", "Product": "Door", "Width": 8740.15748031496, "Height": 94.48818897637796, "Width_mm": 222000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 95,
          id: 2698,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 755,
          evidence_ids: "[755]",
          evidence_id_list: [755],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "015-MC-005", "Product": "Door", "Width": 8740.15748031496, "Height": 255.11811023622047, "Width_mm": 222000, "Height_mm": 6480, "Quantity": 1, "Source Type": "Table"}',
        },
        {
          sequence_number: 96,
          id: 2709,
          take_off_id: 129,
          project_file_id: 428,
          evidence_id: 753,
          evidence_ids: "[753]",
          evidence_id_list: [753],
          is_checked: false,
          is_deleted: false,
          is_reconciled: false,
          reconcile_source_ids: null,
          reconcile_batch_id: null,
          create_user: "flor@latii.com",
          create_time: "2025-11-14T13:37:46",
          update_user: "flor@latii.com",
          update_time: "2025-11-14T13:37:46",
          result:
            '{"Label": "Fixed_Panel_1", "Product": "Door", "Product Type": "Fixed", "Operability": "None", "Width": 196.85, "Height": 94.49, "Width_mm": 5000, "Height_mm": 2400, "Quantity": 1, "Source Type": "Image"}',
        },
      ],
    },
    reconcile_candidates: {
      "428": [
        {
          label: "014-PE-003",
          count: 2,
          item_ids: [2624, 2626],
          items: [
            {
              sequence_number: 19,
              id: 2624,
              take_off_id: 129,
              project_file_id: 428,
              evidence_id: 755,
              evidence_ids: "[755]",
              result: {
                Label: "014-PE-003",
                Product: "Door",
                Width: 70.86614173228347,
                Height: 94.48818897637796,
                Width_mm: 1800,
                Height_mm: 2400,
                Quantity: 5,
                "Source Type": "Table",
              },
            },
            {
              sequence_number: 20,
              id: 2626,
              take_off_id: 129,
              project_file_id: 428,
              evidence_id: 755,
              evidence_ids: "[755]",
              result: {
                Label: "014-PE-003",
                Product: "Door",
                Width: 70.86614173228347,
                Height: 113.38582677165354,
                Width_mm: 1800,
                Height_mm: 2880,
                Quantity: 1,
                "Source Type": "Table",
              },
            },
          ],
        },
      ],
    },
    total_items: 96,
    reconcile_candidate_count: {
      "428": 1,
    },
    project_files: [
      {
        project_id: "01K9WNZ0MJDSY2HM747NFAGEST",
        operation_type: "Architecture_drawing",
        file_type: "PDF",
        file_name: "C-131 a C-134_MEMORIA CARPINTERÍA EXTERIOR.pdf",
        country_of_origin: "United States",
        is_rotate: false,
        rotation_angle: 0,
        create_time: "2025-11-13T18:22:57",
        update_time: "2025-11-13T18:22:58",
        update_user: "flor@latii.com",
        create_user: "flor@latii.com",
        id: 428,
        total_pages: 4,
        parse_detail: {
          image_page_infos: [
            {
              file_name: "0.png",
              s3_key:
                "s3_evidences/pdf/image/9b25c2010f2e4da78b60c1aa378d620f_428_0.png",
              s3_url:
                "https://latii-cato1-dev.s3.amazonaws.com/s3_evidences/pdf/image/9b25c2010f2e4da78b60c1aa378d620f_428_0.png?response-content-disposition=attachment%3B%20filename%3D%220.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260310%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260310T164843Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=c8b3ddbb1ada6fd4d386dc808241db09b21695fbd516cffb396268e5d862e7c1",
            },
            {
              file_name: "1.png",
              s3_key:
                "s3_evidences/pdf/image/0bc4f845e29b423c81ce5545269c06ba_428_1.png",
              s3_url:
                "https://latii-cato1-dev.s3.amazonaws.com/s3_evidences/pdf/image/0bc4f845e29b423c81ce5545269c06ba_428_1.png?response-content-disposition=attachment%3B%20filename%3D%221.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260310%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260310T164843Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=26f150976b3b86aa9d7d9a15b1bf4ababb3821d5ac3747abe3d0b46b78f5b649",
            },
            {
              file_name: "2.png",
              s3_key:
                "s3_evidences/pdf/image/d2414458132542f79954c39ceda5dec5_428_2.png",
              s3_url:
                "https://latii-cato1-dev.s3.amazonaws.com/s3_evidences/pdf/image/d2414458132542f79954c39ceda5dec5_428_2.png?response-content-disposition=attachment%3B%20filename%3D%222.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260310%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260310T164843Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=c4ea247369a066d7c6debe4fd52cdf8693c869534d62c70909653afb2e12cbe9",
            },
            {
              file_name: "3.png",
              s3_key:
                "s3_evidences/pdf/image/03a0d56e44854fa59a8e7c90cc6d3dd2_428_3.png",
              s3_url:
                "https://latii-cato1-dev.s3.amazonaws.com/s3_evidences/pdf/image/03a0d56e44854fa59a8e7c90cc6d3dd2_428_3.png?response-content-disposition=attachment%3B%20filename%3D%223.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260310%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260310T164843Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=ff46861f3bf6085415cdff15db659e3d19bef10e8d9e0e3ef06dda10377cca9d",
            },
          ],
          extract_text_info: {
            file_name: "428.txt",
            s3_key:
              "s3_evidences/pdf/text/1ebd621ceed74a4fae65ff4d671c8594_428_428.txt",
          },
          uploaded_file_key:
            "s3_evidences/original/84e693c7267b4b6c819978693c7aa688_01K9WNZ0MJDSY2HM747NFAGEST_428.pdf",
          uploaded_file_name: "C-131 a C-134_MEMORIA CARPINTERÍA EXTERIOR.pdf",
          uploaded_file_url:
            "https://latii-cato1-dev.s3.amazonaws.com/s3_evidences/original/84e693c7267b4b6c819978693c7aa688_01K9WNZ0MJDSY2HM747NFAGEST_428.pdf?response-content-disposition=attachment%3B%20filename%3D%2284e693c7267b4b6c819978693c7aa688_01K9WNZ0MJDSY2HM747NFAGEST_428.pdf%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260310%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260310T164843Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=dec39ba7626b395e4f4ec35b30ba009148d66e19f20b48ece6f815712bc76f81",
        },
        status: "Uploaded",
      },
    ],
  });
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [pageData, setPageData] = useState({
    current: 1,
    total: 1,
  });

  const [isTableExpanded, setIsTableExpanded] = useState(false);

  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [project, setProject] = useState<any>({});

  // HABILITAR AL DESHARDCODEAR
  /*  useEffect(() => {
    if (takeOffId) getTakeOff();
  }, [takeOffId]); */

  useEffect(() => {
    getProjectInfo();
  }, [projectId]);

  const getFileEvidences = async (fileId?: number) => {
    const response = await getEvidenceByFileId(projectId, fileId as number);
    if (response.status === "success") {
      setFileEvidence(response.data);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      });
    }
  };

  const getProjectInfo = async () => {
    let res = await getTakeOffResult(takeOffId as string);
    if (res.status === "success") {
      setProject(res);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get project",
      });
    }
  };

  const getTakeOff = useCallback(async () => {
    const response = await getTakeOffsDetails(takeOffId as string);
    if (response.status === "success") {
      let res = response.data;
      const exist = res?.take_off_result?.status === 2;
      if (exist) {
        setTakeOff(res);
        if (res?.project_files?.length > 0) {
          //设置pdfurl
          let firstFile = res?.project_files[0];
          let newPdfUrl = firstFile?.parse_detail?.uploaded_file_url;
          setSelectedFileId(firstFile?.id);
          setPdfUrl(newPdfUrl);

          //获取file evidence
          getFileEvidences(firstFile?.id);
        }
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get take off",
      });
    }
  }, [takeOffId]);

  useEffect(() => {
    if (pdfRef.current) {
      pdfRef.current.resetAllInfo();
    }

    //reset page
    setPageData({ current: 1, total: 1 });

    //设置新的url
    let file = takeOff?.project_files.find(
      (file: any) => file.id === selectedFileId,
    );
    if (file) {
      let newPdfUrl = file?.parse_detail?.uploaded_file_url;
      setPdfUrl(newPdfUrl);
      //获取file evidence
      getFileEvidences(selectedFileId);
    }
  }, [selectedFileId]);

  useEffect(() => {
    const checkPages = () => {
      const total = pdfRef.current?.getPageAmount() ?? 0;

      if (total === 0) {
        setTimeout(checkPages, 1000);
        return;
      }

      const newData = { current: 1, total };
      setPageData(newData);
    };

    checkPages();
  }, [pdfUrl]);

  const handleZoomChange = (value: number) => {
    if (value === zoom) return;
    if (value < 0.4 || value > 4) return;
    setZoom(value);
  };

  const handlePageChange = (value: number) => {
    if (value < 1) return;
    if (value > pageData.total) return;
    if (value === pageData.current) return;
    const newData = {
      current: value,
      total: pdfRef.current?.getPageAmount() || 1,
    };
    setPageData(newData);
  };

  const handleRotate = () => {
    pdfRef.current?.rotatePDF();
  };

  const handleTemplateChange = (value: string) => {
    console.log("handleTemplateChange", value);
  };
  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        project={project}
        takeOff={takeOff}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
      />

      <div className={`flex-1 flex overflow-hidden flex-row pr-4`}>
        <div
          className={`${
            isTableExpanded ? "w-4/5" : "w-3/5"
          } pl-10 flex gap-2 transition-all duration-300 ease-in-out`}
        >
          <NewItemsTable
            items={
              takeOff?.project_files?.find(
                (file: any) => file.id === selectedFileId,
              )?.item_result ?? []
            }
          />
          {/* <ItemsTable
            takeOff={takeOff}
            selectedFileId={selectedFileId}
            onRefreshItems={getTakeOff}
          /> */}
        </div>
        <div className="flex items-center relative mx-5">
          <Divider type="vertical" className="h-full bg-primaryN30" />
          <div className="absolute left-1/2 transform -translate-x-1/2 top-5 flex items-center border border-primaryN30 rounded-full bg-white overflow-hidden">
            <div
              className="px-2 rounded-l-lg hover:bg-primaryN10 cursor-pointer text-basicLightGray font-light"
              onClick={() => setIsTableExpanded(false)}
            >
              {"<"}
            </div>
            <div
              className="px-2 rounded-r-lg hover:bg-primaryN10 cursor-pointer text-basicLightGray font-light"
              onClick={() => setIsTableExpanded(true)}
            >
              {">"}
            </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden pt-8`}>
          <div className="h-auto">
            <PdfButtons
              zoom={zoom}
              handleZoomChange={handleZoomChange}
              page={pageData.current}
              totalPages={pageData.total}
              handlePageChange={handlePageChange}
              handleRotate={handleRotate}
            ></PdfButtons>
          </div>
          <PdfWrapper
            ref={pdfRef}
            operationMode={"view"}
            pdfUrl={pdfUrl as string}
            project_id={projectId}
            project_file_id={selectedFileId}
            zoom={zoom}
            page={pageData.current}
            allEvidence={fileEvidence}
            onRefreshEvidence={getFileEvidences}
            onChangeZoom={handleZoomChange}
          ></PdfWrapper>
        </div>
      </div>
    </div>
  );
};

export default Analyze;

type PdfTitleProps = {
  zoom: number;
  handleZoomChange: (value: number) => void;
  page: number;
  totalPages: number;
  handlePageChange: (value: number) => void;
  handleRotate: () => void;
};

const PdfButtons = ({
  zoom,
  handleZoomChange,
  page,
  totalPages,
  handlePageChange,
  handleRotate,
}: PdfTitleProps) => {
  const router = useRouter();
  return (
    <div className="flex justify-end px-14 py-4 gap-4">
      <div className="flex flex-row">
        <div
          className="w-7 h-6 flex justify-center items-center rounded-tl-xl rounded-bl-xl bg-primaryN20 cursor-pointer text-grey-light-strong"
          onClick={() => {
            handleZoomChange(zoom - 0.1);
          }}
        >
          -
        </div>
        <div
          className="w-7 h-6 flex justify-center items-center rounded-tr-xl rounded-br-xl bg-primaryN20 cursor-pointer text-grey-light-strong"
          style={{ marginLeft: 1 }}
          onClick={() => handleZoomChange(zoom + 0.1)}
        >
          +
        </div>

        <span
          className="ml-4 flex items-center justify-center rounded-md text-center text-basicDarkGray text-[10px] border border-solid border-primaryN30"
          style={{
            width: 54,
            height: 24,
          }}
        >
          {(zoom * 100).toFixed(0) + "%"}
        </span>
      </div>
      <div className="flex gap-3 items-center rounded-lg border border-primaryN30 overflow-hidden px-1">
        <div
          className={`h-full py-2 w-2 flex items-center justify-center ${
            page === 1 ? "cursor-default opacity-50" : "cursor-pointer"
          }`}
          onClick={() => handlePageChange(page - 1)}
        >
          <Image
            src="/assets/icons/arrow-left-gray.svg"
            alt="arrow left icon"
            width={6}
            height={6}
          />
        </div>
        <p className="text-grey-normal text-xxs">Page {page}</p>
        <div
          className={`h-full py-2 w-2 flex items-center justify-center ${
            page === totalPages ? "cursor-default opacity-50" : "cursor-pointer"
          }`}
          onClick={() => handlePageChange(page + 1)}
        >
          <Image
            src="/assets/icons/arrow-right-gray.svg"
            alt="arrow right icon"
            width={6}
            height={6}
          />
        </div>
      </div>
      <div
        className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-grey-normal`}
        onClick={() => handleRotate()}
      >
        <p className="text-xs text-center">Rotate</p>
      </div>
    </div>
  );
};
