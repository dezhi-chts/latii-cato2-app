import { ReactNode, MouseEventHandler } from "react";
import { colorList } from "../theme/colors";

type ButtonVariant = "primary" | "outline" | "disabled";

const hoverVariants: Record<ButtonVariant, string> = {
  primary: "hover:opacity-90",
  outline: "hover:opacity-70",
  disabled: "",
};

interface Props {
  children: ReactNode;
  backgroundColor?: keyof typeof colorList | null;
  color?: keyof typeof colorList | string;
  borderColor?: keyof typeof colorList;
  className?: string;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

interface ButtonStyle {
  backgroundColor: string;
  color: string;
  border: string;
  cursor?: string;
  opacity?: number;
}

const Button = ({
  children,
  onClick,
  backgroundColor = "primaryN900",
  color = "white",
  borderColor = "lushAqua",
  variant = "primary",
  className,
  disabled = variant === "disabled",
}: Props) => {
  const buttonStyles: Record<ButtonVariant, ButtonStyle> = {
    primary: {
      backgroundColor: colorList[backgroundColor as keyof typeof colorList],
      color: colorList[color as keyof typeof colorList] || color,
      border: "1px solid transparent",
    },
    outline: {
      backgroundColor: "white",
      color: colorList[borderColor] || color,
      border: `1px solid ${colorList[borderColor] || color}`,
    },
    disabled: {
      backgroundColor: "#D3D3D3",
      color: "#000000",
      border: "1px solid transparent",
      cursor: "not-allowed",
      opacity: 0.6,
    },
    // En caso de necesitar una nueva variante, crear sus estilos aca, y agregarla a hoverVariants y ButtonVariants
  };

  const hoverClass = hoverVariants[variant as ButtonVariant] || "";

  return (
    <button
      className={`${className} rounded-full py-1 px-3.5 h-fit transition-all duration-150 text-sm ${hoverClass}`}
      style={disabled ? buttonStyles.disabled : buttonStyles[variant]}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
