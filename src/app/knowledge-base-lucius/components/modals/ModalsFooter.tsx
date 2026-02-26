import Button from "@/components/Button";

type ModalsFooterProps = {
  disabled: boolean;
  onCancel: () => void;
  hasData?: boolean;
  onDelete?: () => void;
};

export const ModalsFooter = ({
  disabled,
  onCancel,
  hasData,
  onDelete,
}: ModalsFooterProps) => {
  return (
    <div className="flex justify-end gap-4">
      <Button
        className="!py-0"
        variant="outline"
        onClick={hasData ? onDelete : onCancel}
        borderColor={hasData ? "dragonOrange" : "grey-normal"}
      >
        {hasData ? "Delete" : "Cancel"}
      </Button>
      <Button
        className="!py-0"
        backgroundColor="forumBlue-normal"
        disabled={disabled}
      >
        Add
      </Button>
    </div>
  );
};
