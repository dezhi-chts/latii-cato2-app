import { getDividerText, getFileName } from "@/lib/functions";
import { Popover } from "antd";
import Image from "next/image";

type BadgeOption = "sdl" | "frame" | "glass";
type Placement =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "bottomRight"
  | "topRight"
  | "bottomLeft"
  | "topLeft"
  | "rightBottom"
  | "leftBottom"
  | "leftTop"
  | "rightTop";

interface InformationBadgeProps {
  badge: BadgeOption;
  title?: string;
  details?: string;
  type?: string;
  coating?: string;
  isGlassCustom?: boolean;
  customGlass?: string;
  item?: any;
}

const nameToFileMap: Record<string, string> = {
  "bella indoors": "bella_indoor.webp",
  bella: "bella.webp",
  vista: "vista.webp",
  murano: "murano.webp",
  castelo: "castelo.webp",
  "goya plus": "goya_plus.webp",
  "goya hs": "goya_hs.webp",
  goya: "goya.webp",
  "dali fold": "dali_fold.webp",
  "dali slide": "dali_slide.webp",
  "dali slide plus": "dali_slide_plus.webp",
  "dali swing": "dali_swing.webp",
  "dali pivot": "dali_pivot.webp",
};

const InformationBadge = ({
  badge,
  title,
  details,
  type,
  coating,
  isGlassCustom,
  customGlass,
  item,
}: InformationBadgeProps) => {
  const badgeMap: Record<BadgeOption, JSX.Element> = {
    sdl: <SdlPopover title={title} item={item} />,
    frame: <FramePopover title={title} />,
    glass: (
      <GlassPopover
        title={title}
        details={details}
        type={type}
        coating={coating}
        isGlassCustom={isGlassCustom}
        customGlass={customGlass}
      />
    ),
  };

  const placementMap: Record<BadgeOption, Placement> = {
    sdl: "bottomLeft",
    frame: "rightTop",
    glass: "left",
  };

  return (
    <Popover
      content={
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="cursor-default"
        >
          {badgeMap[badge]}
        </div>
      }
      styles={{ body: { padding: 0, margin: 0 } }}
      arrow={false}
      placement={placementMap[badge]}
      className="cursor-default"
    >
      <Image
        src="/assets/icons/information-badge.svg"
        alt="information badge"
        width={15}
        height={15}
        style={{ width: "auto", height: "auto" }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      />
    </Popover>
  );
};

const SdlPopover = ({ title, item }: any) => {
  const text =
    title === "SDL" || title === "TDL"
      ? getDividerText(item, title)
      : `Standard ${title}`;

  const isCortizo = item?.frame_material?.selected_value === "Spazio-Aluminum";

  const nameToFileMap: Record<string, string> = {
    standard: isCortizo ? "standard_spazio.webp" : "standard_bellavista.webp",
    thin: "thin.webp",
    "flat 25mm": "flat_25.webp",
    "flat 31mm": "flat_31.webp",
    chalice: "chalice.webp",
    beveled: "beveled.webp",
    "flat 20mm": "flat_20.webp",
  };

  const imageName = getFileName(text, nameToFileMap);

  const src = imageName
    ? `/assets/images/information-badges/sdl_tdl/${imageName}`
    : "/assets/images/information-badges/sdl.png";

  return (
    <div className="flex flex-col rounded-lg border border-primaryN30 bg-white px-5 py-4 gap-4">
      <div className="flex items-center gap-4">
        <Image src={src} width={94} height={72} alt="sdl image" />
        <p className="text-xs text-basicGray">{text}</p>
      </div>
      <BottomPart />
    </div>
  );
};

const FramePopover = ({ title }: any) => {
  const imageName = getFileName(title, nameToFileMap);
  const src = imageName
    ? `/assets/images/information-badges/lines/${imageName}`
    : "/assets/images/information-badges/frame.png";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primaryN30 bg-white px-5 py-4">
      <div className="flex items-center gap-5">
        <Image src={src} width={69} height={81} alt="frame image" />
        <div className="flex flex-col gap-1 text-basicGray">
          <p className="font-semibold">{title}</p>
          <p className="text-sm ">Minimalist Profiles</p>
        </div>
      </div>
      <BottomPart />
    </div>
  );
};

const GlassPopover = ({
  title,
  details,
  type,
  coating,
  isGlassCustom,
  customGlass,
}: any) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primaryN30 bg-white px-5 py-4">
      <div className="flex gap-4">
        <Image
          src="/assets/images/information-badges/glass.png"
          width={43}
          height={43}
          alt="glass image"
          className="w-10 h-10"
        />
        <div className="flex flex-col gap-1 text-basicGray text-sm">
          <p className="font-semibold">{isGlassCustom ? "Custom" : title}</p>
          <p>{isGlassCustom ? customGlass : details}</p>
          <p>
            <span className="font-semibold">Type: </span>
            {type}
          </p>
          <p>
            <span className="font-semibold">Coating: </span>
            {coating}
          </p>
        </div>
      </div>
      <BottomPart />
    </div>
  );
};

const BottomPart = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/assets/icons/information-badge.svg"
        alt="information badge"
        width={15}
        height={15}
      />
      <p className="text-[11px] text-[#3C3C3C]">
        This item is using this specific selection.
      </p>
    </div>
  );
};

export default InformationBadge;
