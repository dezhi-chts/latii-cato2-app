import type { ReactNode } from "react";
import { message, notification } from "antd";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotifyOptions {
  title?: ReactNode;
  description?: ReactNode;
  key?: string;
  duration?: number;
}

const DEFAULT_NOTIFICATION_KEY_PREFIX = "global-notification";
const DEFAULT_MESSAGE_KEY_PREFIX = "global-message";
const DEFAULT_NOTIFICATION_DURATION = 2;

let isConfigured = false;
let notificationSeq = 0;
let messageSeq = 0;

const ensureConfigured = () => {
  if (isConfigured) return;
  notification.config({
    maxCount: 1,
    placement: "topRight",
  });
  message.config({
    maxCount: 1,
    top: 24,
  });
  isConfigured = true;
};

const getDefaultTitle = (type: NotificationType) => {
  if (type === "success") return "Success";
  if (type === "error") return "Error";
  if (type === "warning") return "Warning";
  return "Notice";
};

const open = (type: NotificationType, options: NotifyOptions) => {
  ensureConfigured();
  // Always clear old one before showing the latest notification.
  notification.destroy();
  notificationSeq += 1;
  notification[type]({
    key: options.key || `${DEFAULT_NOTIFICATION_KEY_PREFIX}-${notificationSeq}`,
    message: options.title || getDefaultTitle(type),
    description: options.description,
    duration: options.duration ?? DEFAULT_NOTIFICATION_DURATION,
  });
};

export const notify = {
  success: (options: NotifyOptions) => open("success", options),
  error: (options: NotifyOptions) => open("error", options),
  warning: (options: NotifyOptions) => open("warning", options),
  info: (options: NotifyOptions) => open("info", options),
  toastError: (content: ReactNode, duration = 2) => {
    ensureConfigured();
    // Keep only the latest toast message visible.
    message.destroy();
    messageSeq += 1;
    message.error({
      key: `${DEFAULT_MESSAGE_KEY_PREFIX}-${messageSeq}`,
      content,
      duration,
    });
  },
  toastSuccess: (content: ReactNode, duration = 2) => {
    ensureConfigured();
    // Keep only the latest toast message visible.
    message.destroy();
    messageSeq += 1;
    message.success({
      key: `${DEFAULT_MESSAGE_KEY_PREFIX}-${messageSeq}`,
      content,
      duration,
    });
  },
};

