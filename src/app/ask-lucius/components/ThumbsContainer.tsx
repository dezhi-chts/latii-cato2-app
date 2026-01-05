import { ThumbIcon } from "./Thumb";
import { Feedback, Message } from "@/types/ask-lucius";

type ThumbsContainerProps = {
  message: Message;
  handleChangeFeedback: (messageIndex: number, feedback: Feedback) => void;
  messageIndex: number;
};

const ThumbsContainer = ({
  message,
  handleChangeFeedback,
  messageIndex,
}: ThumbsContainerProps) => {
  return (
    <div className="flex gap-2">
      <ThumbIcon
        isSelected={message.response_feedback === "bad"}
        handleChangeFeedback={handleChangeFeedback}
        messageIndex={messageIndex}
        direction="down"
      />
      <ThumbIcon
        isSelected={message.response_feedback === "good"}
        handleChangeFeedback={handleChangeFeedback}
        messageIndex={messageIndex}
        direction="up"
      />
    </div>
  );
};

export default ThumbsContainer;
