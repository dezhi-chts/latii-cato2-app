"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CreateProjectModal from "@/app/projects/[projectId]/components/Create-Project-Modal";
import UploadFilesProgress from "@/app/projects/[projectId]/components/Upload-Files-Progress";
import PdfParseModal from "@/app/projects/[projectId]/components/Pdf-Parse-Modal";
import CreateProjectTakeoffModal from "@/app/projects/[projectId]/components/Create-Project-Takeoff-Modal";

interface CreateProjectFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshProjects?: () => void;
}

export default function CreateProjectFlowModal({
  isOpen,
  onClose,
  refreshProjects,
}: CreateProjectFlowModalProps) {
  const router = useRouter();
  const uploadFilesRef = useRef<any>(null);
  const projectInfoRef = useRef<any>(null);

  const [showUploadProgess, setShowUploadProgess] = useState<boolean>(false);
  const [showPdfParseModal, setShowPdfParseModal] = useState<boolean>(false);
  const [showCreateProjectTakeOffModal, setShowCreateProjectTakeOffModal] =
    useState<boolean>(false);

  const closeAll = () => {
    setShowUploadProgess(false);
    setShowPdfParseModal(false);
    setShowCreateProjectTakeOffModal(false);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <CreateProjectModal
          isOpen={isOpen}
          closeModal={onClose}
          refreshProjects={refreshProjects}
          onHandleUpload={(data: any) => {
            uploadFilesRef.current = data;
            setShowUploadProgess(true);
          }}
        />
      )}

      {showUploadProgess && (
        <UploadFilesProgress
          isOpen={showUploadProgess}
          closeModal={() => setShowUploadProgess(false)}
          uploadFilesData={uploadFilesRef.current}
          onSuccess={(data: any) => {
            setShowUploadProgess(false);
            projectInfoRef.current = data;
            setShowPdfParseModal(true);
            onClose();
            refreshProjects?.();
          }}
        />
      )}

      {showPdfParseModal && (
        <PdfParseModal
          isOpen={showPdfParseModal}
          closeModal={() => setShowPdfParseModal(false)}
          data={projectInfoRef.current}
          handleNext={(type: "takeoffModal" | "pageIndex") => {
            setShowPdfParseModal(false);
            if (type === "takeoffModal") {
              setShowCreateProjectTakeOffModal(true);
              return;
            }
            closeAll();
            router.push(
              `/projects/${projectInfoRef.current.project_id}/takeoff/${projectInfoRef.current.take_off_id}/identification`,
            );
          }}
          handleCancel={() => {
            setShowPdfParseModal(false);
          }}
        />
      )}

      {showCreateProjectTakeOffModal && (
        <CreateProjectTakeoffModal
          isOpen={showCreateProjectTakeOffModal}
          closeModal={() => {
            setShowCreateProjectTakeOffModal(false);
            closeAll();
          }}
          projectId={projectInfoRef.current?.project_id ?? null}
          takeOffId={projectInfoRef.current?.take_off_id ?? null}
        />
      )}
    </>
  );
}
