import Image from "next/image";

type Brands = "BELLAVISTA-Steel" | "Spazio-Aluminum";

type HoverCardProps = {
  brand: Brands;
};
const HoverCard = ({ brand }: HoverCardProps) => {
  const brandOptions = {
    "BELLAVISTA-Steel": {
      logo: "/assets/logos/bellavista-logo.svg",
      image: "/assets/images/bellavista-hover.png",
      title: "Cold Rolled Steel",
      description:
        "Experience the pinnacle of Italian elegance with our precision-crafted profiles, blending refined minimalist design with thermal insulation.",
      url: "https://latii.com/pages/bellavista-craft-steel",
    },
    "Spazio-Aluminum": {
      logo: "/assets/logos/spazio-logo.svg",
      image: "/assets/images/spazio-hover.jpg",
      title: "Architectural Aluminum",
      description:
        "Minimalist and expansive, redefine bringing the outside inside. European finesse with practical functionality, boasting exceptional thermal insulation.",
      url: "https://latii.com/pages/spazio-architectural-aluminum",
    },
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-8 rounded-xl border bg-white border-primaryN30 h-fit w-[320px] shadow-md zoomed-container ">
      <Image
        alt="brand logo"
        src={brandOptions[brand].logo}
        width={174}
        height={30}
        className="h-8 w-auto"
      />
      <div className="relative h-[139px] w-[271px] overflow-hidden rounded-xl">
        <Image
          alt="brand image"
          src={brandOptions[brand].image}
          fill
          className="object-cover object-center"
        />
      </div>

      <p className="text-grey-normal font-bold">{brandOptions[brand].title}</p>
      <p className="text-grey-normal text-sm">
        {brandOptions[brand].description}
      </p>
      <a
        href={brandOptions[brand].url}
        target="_blank"
        rel="noreferrer"
        className="text-kahuBlue hover:underline text-xs"
      >
        Learn More
      </a>
    </div>
  );
};

export default HoverCard;
