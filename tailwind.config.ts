import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["Nunito Sans", "sans-serif"],
      },
      colors: {
        forumBlue: {
          light: {
            DEFAULT: "#ECF2FA",
            hover: "#E3EBF8",
            active: "#C4D6F0",
          },
          normal: {
            DEFAULT: "#427CCE",
            hover: "#3B70B9",
            active: "#3563A5",
          },
          dark: {
            DEFAULT: "#325D9B",
            hover: "#284A7C",
            active: "#1E385D",
          },
        },
        grey: {
          light: {
            DEFAULT: "#F8F8F8",
            hover: "#E8E8E8",
            active: "#DCDCDC",
            strong: "#A3A3A3",
          },
          normal: {
            DEFAULT: "#717171",
          },
          dark: {
            DEFAULT: "#555555",
            active: "#0C0C0C",
          },
        },
        green: {
          light: {
            DEFAULT: "#E6F6EF",
            hover: "#D9F2E7",
            active: "#B1E4CE",
          },
          normal: {
            DEFAULT: "#02A960",
            hover: "#029856",
            active: "#02874D",
          },
          dark: {
            active: "#014C2B",
          },
        },
        orange: {
          light: {
            DEFAULT: "#FFF4E8",
            hover: "#FFEFDD",
            active: "#FFDEB9",
          },
          normal: {
            DEFAULT: "#FF931D",
            hover: "#E6841A",
            active: "#CC7617",
          },
          dark: {
            active: "#73420D",
          },
        },
        yellow: {
          light: {
            DEFAULT: "#FEF9E7",
            hover: "#FEF6DA",
            active: "#FCEBB3",
          },
          normal: {
            DEFAULT: "#F5C00B",
            hover: "#DDAD0A",
            active: "#C49A09",
          },
          dark: {
            active: "#6E5605",
          },
        },
        red: {
          light: {
            DEFAULT: "#FDEBEB",
            hover: "#FCE1E1",
            active: "#F8C1C1",
          },
          normal: {
            DEFAULT: "#E83838",
            hover: "#D13232",
            active: "#BA2D2D",
          },
          dark: {
            active: "#681919",
          },
        },
        teal: {
          light: {
            DEFAULT: "#E7F9F9",
            hover: "#DAF6F5",
            active: "#B3EDEB",
          },
          normal: {
            DEFAULT: "#0BC6BE",
            hover: "#0AB2AB",
            active: "#099E98",
          },
          dark: {
            active: "#055955",
          },
        },
        cyan: {
          light: {
            DEFAULT: "#E6F2F3",
            hover: "#D9EBED",
            active: "#B0D5DB",
          },
          normal: {
            DEFAULT: "#00798A",
            hover: "#006D7C",
            active: "#00616E",
          },
          dark: {
            active: "#00363E",
          },
        },
        violet: {
          light: {
            DEFAULT: "#F1E0FB",
            hover: "#F9E8F9",
            active: "#F3D0F3",
          },
          normal: {
            DEFAULT: "#D868D8",
            hover: "#C25EC2",
            active: "#AD53AD",
          },
          dark: {
            active: "#612F61",
          },
        },
        indigo: {
          light: {
            DEFAULT: "#EEEEFB",
            hover: "#E6E6F9",
            active: "#CBCBF2",
          },
          normal: {
            DEFAULT: "#5859D6",
            hover: "#4F50C1",
            active: "#4647AB",
          },
          dark: {
            active: "#282860",
          },
        },
        purple: {
          light: {
            DEFAULT: "#F3E9F8",
            hover: "#EDDEF4",
            active: "#D9BCE9",
          },
          normal: {
            DEFAULT: "#8626B7",
            hover: "#7922A5",
            active: "#6B1E92",
          },
          dark: {
            active: "#3C1152",
          },
        },
        brown: {
          light: {
            DEFAULT: "#F6F3EF",
            hover: "#F1ECE7",
            active: "#E2D9CD",
          },
          normal: {
            DEFAULT: "#A3835F",
            hover: "#937656",
            active: "#82694C",
          },
          dark: {
            active: "#493B2B",
          },
        },

        elusionDarkGrayTint: "#A0A0A0",
        basicLightGray: "#B1B1B1",
        primaryN10: "#FAFBFB",
        primaryN20: "#F5F6F7",
        primaryN30: "#EBEDF0",
        primaryN50: "#C2C7D0",
        primaryN70: "#98A1B0",
        primaryN200: "#6B788E",
        primaryN400: "#013249",
        primaryN900: "#091E42",
        neutralsN600: "#354764",
        neutralsN40: "#DFE2E6",
        kahuBlue: "#008ECE",
        disarmBlue: "#006C9B;",
        white: "#FFFFFF",
        dragonOrange: "#FF931E",
        accentRed: "#FE3C30",
        accentBananas: "#F6CE4C",
        accentIndigo: "#5856D7",
        accentPurple: "#AF53DE",
        warningW400: "#DEB945",
        primaryBlueHover: "#03122C",
        dragonOrangeHover: "#F17D00",
        lushAqua: "#014768",
        secondary400: "#2B6F7A",
        loadingGray: "#D9D9D9",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        xxs: "10px",
      },
    },
  },
  plugins: [],
} satisfies Config;
