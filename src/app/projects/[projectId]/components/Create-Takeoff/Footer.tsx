import Button from "@/components/Button";

type FooterProps = {
  handleClick: () => void;
  disabled: boolean;
};

export const Footer = ({ handleClick, disabled }: FooterProps) => {
  return (
    <div className="flex justify-center">
      <Button
        color="white"
        backgroundColor="forumBlue"
        onClick={handleClick}
        className="w-80 !py-0.5"
        disabled={disabled}
      >
        Start
      </Button>
    </div>
  );
};
