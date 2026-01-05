import { Feedback } from "@/types/ask-lucius";
import { Tooltip } from "antd";
import { JSX } from "react";

type Direction = "up" | "down";
export type ThumbsProps = {
  isSelected: boolean;
  handleChangeFeedback: (messageIndex: number, feedback: Feedback) => void;
  messageIndex: number;
  direction: Direction;
};
const THUMB_PATHS: Record<Direction, JSX.Element> = {
  up: (
    <>
      <rect width="17.0417" height="16" rx="4" fill="white" />
      <path
        d="M11.7077 7.45753L11.7077 13.1242C11.7077 13.3121 11.7823 13.4922 11.9151 13.6251C12.048 13.7579 12.2282 13.8325 12.416 13.8325L13.8327 13.8325C14.0205 13.8325 14.2007 13.7579 14.3335 13.6251C14.4664 13.4922 14.541 13.3121 14.541 13.1242L14.541 8.16586C14.541 7.978 14.4664 7.79783 14.3336 7.66499C14.2007 7.53215 14.0205 7.45753 13.8327 7.45753L11.7077 7.45753ZM11.7077 7.45753C10.9562 7.45753 10.2356 7.15902 9.70421 6.62766C9.17286 6.09631 8.87435 5.37564 8.87435 4.62419L8.87435 3.91586C8.87435 3.54014 8.72509 3.1798 8.45942 2.91413C8.19374 2.64845 7.83341 2.49919 7.45768 2.49919C7.08196 2.49919 6.72163 2.64845 6.45595 2.91413C6.19027 3.1798 6.04102 3.54014 6.04102 3.91586L6.04102 7.45753L3.91602 7.45753C3.54029 7.45753 3.17996 7.60678 2.91428 7.87246C2.6486 8.13813 2.49935 8.49847 2.49935 8.87419L3.20768 12.4159C3.30955 12.8504 3.50279 13.2235 3.7583 13.479C4.01381 13.7346 4.31776 13.8586 4.62435 13.8325L9.58268 13.8325C10.1463 13.8325 10.6868 13.6086 11.0853 13.2101C11.4838 12.8116 11.7077 12.2711 11.7077 11.7075"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  down: (
    <path
      d="M5.33333 8.87841V3.21174C5.33333 3.02388 5.25871 2.84372 5.12587 2.71088C4.99303 2.57804 4.81286 2.50341 4.625 2.50341H3.20833C3.02047 2.50341 2.8403 2.57804 2.70747 2.71088C2.57463 2.84372 2.5 3.02388 2.5 3.21174V8.17008C2.5 8.35794 2.57463 8.53811 2.70747 8.67094C2.8403 8.80378 3.02047 8.87841 3.20833 8.87841H5.33333ZM5.33333 8.87841C6.08478 8.87841 6.80545 9.17692 7.3368 9.70827C7.86816 10.2396 8.16667 10.9603 8.16667 11.7117V12.4201C8.16667 12.7958 8.31592 13.1561 8.5816 13.4218C8.84728 13.6875 9.20761 13.8367 9.58333 13.8367C9.95906 13.8367 10.3194 13.6875 10.5851 13.4218C10.8507 13.1561 11 12.7958 11 12.4201V8.87841H13.125C13.5007 8.87841 13.8611 8.72915 14.1267 8.46348C14.3924 8.1978 14.5417 7.83747 14.5417 7.46174L13.8333 3.92008C13.7315 3.48553 13.5382 3.1124 13.2827 2.85689C13.0272 2.60138 12.7233 2.47733 12.4167 2.50341H7.45833C6.89475 2.50341 6.35425 2.72729 5.95573 3.12581C5.55722 3.52432 5.33333 4.06483 5.33333 4.62841"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const FEEDBACK_BY_DIRECTION: Record<Direction, Feedback> = {
  up: "good",
  down: "bad",
};

const TOOLTIP_BY_DIRECTION: Record<Direction, string> = {
  up: "Good Response",
  down: "Bad Response",
};

export const ThumbIcon = ({
  isSelected,
  handleChangeFeedback,
  messageIndex,
  direction,
}: ThumbsProps) => {
  return (
    <Tooltip title={TOOLTIP_BY_DIRECTION[direction]}>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() =>
          handleChangeFeedback(messageIndex, FEEDBACK_BY_DIRECTION[direction])
        }
        className={`
          cursor-pointer
          bg-transparent
          border-none
          p-0
          transition-colors
          ${isSelected ? "text-black" : "text-[#C2C7D0]"}
        `}
      >
        <svg
          width="18"
          height="16"
          viewBox="0 0 18 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {THUMB_PATHS[direction]}
        </svg>
      </button>
    </Tooltip>
  );
};
