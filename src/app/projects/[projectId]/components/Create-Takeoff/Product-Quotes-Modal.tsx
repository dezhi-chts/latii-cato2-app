import { Modal } from "antd";
import Image from "next/image";
import { FooterButton } from "./Schedules-Modal";

type BaseInfoModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const ProductQuotesModal = ({
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
      <div className="flex flex-col gap-8 ml-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-forumBlue-normal text-lg">Product Quote List</p>
          <p className="font-light text-xs">
            To ensure accurate AI reading and faster processing, please follow
            these guidelines when uploading your PDF.
          </p>
        </div>
        <div className="w-full flex gap-8">
          <div className="w-1/2 text-xs font-light flex flex-col gap-4">
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>The file must be in PDF format.</li>
              <li>Reading Orientation of the PDF</li>
            </ul>
            <div>
              <p>⚠️ Important:</p>
              <ul className="list-disc list-inside">
                <li>
                  Our AI understands and translates the the following brands
                  quotes to a Latii comparable quote (template version as
                  dated).
                  <br />
                  If you will like for us to include other brands please contact
                  your sales partner to start the process.
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
          <Image
            src="/assets/cato-images/product-quotes-2.svg"
            alt="product quotes image"
            width={664}
            height={724}
            className="w-1/2 h-auto"
          />
        </div>
      </div>
    </Modal>
  );
};
