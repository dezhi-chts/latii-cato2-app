import Button from "@/components/Button";
import { Modal } from "antd";
import Image from "next/image";

type BaseInfoModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const SchedulesModal = ({ isOpen, setIsOpen }: BaseInfoModalProps) => {
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
          <p className="text-forumBlue text-lg">Schedules & Tables</p>
          <p className="font-light text-xs">
            To ensure accurate AI reading and faster processing, please follow
            these guidelines when uploading your PDF.
          </p>
        </div>
        <div className="w-full flex gap-8">
          <Image
            src="/assets/cato-images/schedules-tables-2.png"
            alt="schedules and tables image"
            width={393}
            height={248}
            className="w-1/2 h-auto"
          />
          <div className="w-1/2 text-xs font-light flex flex-col gap-4">
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>
                CATO only reads PDFs, with architectural schedules and tables.
              </li>
              <li>
                All text must be typed and legible — no handwritten notes.
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

export const FooterButton = ({ handleClick }: { handleClick: () => void }) => {
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      color="neutralsN600"
      className="!py-0 text-xs !border-neutralsN600"
    >
      Close
    </Button>
  );
};
