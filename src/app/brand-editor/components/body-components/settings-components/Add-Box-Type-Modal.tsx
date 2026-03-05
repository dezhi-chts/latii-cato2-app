"use client";

import { Modal } from "antd";

type ModalProps = {
  isOpen: boolean;
  setIsOpen: () => void;
  handleCancel: () => void;
  onOk: () => void;
};
const AddBoxTypeModal = (props: ModalProps) => {
  <Modal open={props.isOpen}></Modal>;
};
