import { Modal } from "antd";
import Image from "next/image";
import { FooterButton } from "./Schedules-Modal";

type BaseInfoModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const ArchitecturalDrawingModal = ({
  isOpen,
  setIsOpen,
}: BaseInfoModalProps) => {
  return (
    <Modal
      width={850}
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      centered
      footer={<FooterButton handleClick={() => setIsOpen(false)} />}
    >
      <div className="flex flex-col  gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-forumBlue text-lg">Architectural Drawings</p>
          <p className="font-light text-xs">
            To ensure accurate AI reading and faster processing, please follow
            these guidelines when uploading your PDF.
          </p>
        </div>
        <div className="w-full flex gap-8">
          <Image
            src="/assets/cato-images/architectural-drawings-2.png"
            alt="architectural drawings image"
            width={393}
            height={248}
            className="w-1/2 h-auto"
          />
          <div className="w-1/2 text-xs font-light flex flex-col gap-4">
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>The file must be in PDF format.</li>
              <li>
                All text must be typed and legible — no handwritten notes.
              </li>
              <li>
                The PDF must include key architectural documents such as
                floor-plans, elevations, and schedules.
              </li>
              <li>Reading Orientation of the PDF</li>
            </ul>
            <div>
              <p>⚠️ Important:</p>
              <ul className="list-disc list-inside">
                <li>
                  Do not place drawings or marks on top of the plans, as they
                  may interfere with AI recognition.
                </li>
              </ul>
            </div>
            <div>
              <p>💡 Pro Tip (Preferred):</p>
              <ul className="list-disc list-inside">
                <li>
                  Remove any unnecessary pages before uploading to reduce
                  processing time and improve quoting accuracy.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
