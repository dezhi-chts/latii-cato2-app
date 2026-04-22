"use client";

import { Modal } from "antd";
import Image from "next/image";
import React from "react";

const products = {
  BELLAVISTA: {
    BELLA: {
      BELLA: [
        {
          variant: "BELLA 65",
          frameDepth: "2 9/16″ - 65mm",
          priceVariation: "Base",
        },
        {
          variant: "BELLA 75",
          frameDepth: "2 5/16″ - 75mm",
          priceVariation: "+ ~10%",
        },
        {
          variant: "BELLA Indoors",
          frameDepth: "1 9/16″ - 40mm",
          priceVariation: "Base",
        },
      ],
      MURANO: [
        {
          variant: "MURANO 75",
          frameDepth: "2 5/16″ - 75mm",
          priceVariation: "+ ~10%",
        },
      ],
      CASTELO: [
        {
          variant: "CASTELO 75",
          frameDepth: "2 5/16″ - 75mm",
          priceVariation: "+ ~10%",
        },
      ],
    },
    VISTA: {
      VISTA: [
        {
          variant: "VISTA 65",
          frameDepth: "2 5/16″ - 65mm",
          priceVariation: "Base",
        },
        {
          variant: "VISTA 75",
          frameDepth: "2 5/16″ - 75mm",
          priceVariation: "+ ~30%",
        },
        {
          variant: "VISTA 85",
          frameDepth: "2 3/8″ - 85mm",
          priceVariation: "+ ~50%",
        },
      ],
    },
  },

  SPAZIO: {
    GOYA: {
      GOYA: [
        {
          variant: "GOYA",
          frameDepth: "2 3/4″ - 70mm",
          priceVariation: "Base",
        },
        {
          variant: "GOYA Plus 60",
          frameDepth: "2 23/64″ - 60mm",
          priceVariation: "Base",
        },
      ],
      "GOYA Plus": [
        {
          variant: "GOYA Plus 70",
          frameDepth: "2 3/4″ - 70mm",
          priceVariation: "+ ~10%",
        },
        {
          variant: "GOYA Plus 80",
          frameDepth: "3 5/32″ - 80mm",
          priceVariation: "+ ~25%",
        },
      ],
      "GOYA HS": [
        {
          variant: "GOYA HS 60",
          frameDepth: "2 23/64″ - 60mm",
          priceVariation: "Base",
        },
        {
          variant: "GOYA HS 70",
          frameDepth: "2 3/4″ - 70mm",
          priceVariation: "+ ~10%",
        },
        {
          variant: "GOYA HS 80",
          frameDepth: "3 5/32″ - 80mm",
          priceVariation: "+ ~25%",
        },
      ],
    },
    DALI: {
      "DALI Fold": [
        {
          variant: "DALI Fold",
          frameDepth: "3 5/32″ - 80mm",
          priceVariation: "Base",
        },
      ],
      "DALI Slide": [
        {
          variant: "DALI Slide",
          frameDepth: "Depends on configuration",
          priceVariation: "Base",
        },
        {
          variant: "DALI Slide Plus",
          frameDepth: "Depends on configuration",
          priceVariation: "+ ~50%",
        },
      ],
      "DALI Swing": [
        {
          variant: "DALI Swing 70",
          frameDepth: "2 3/4″ - 70mm",
          priceVariation: "Base",
        },
        {
          variant: "DALI Swing 80",
          frameDepth: "3 5/32″ - 80mm",
          priceVariation: "+ ~10%",
        },
      ],
      "DALI Pivot": [
        {
          variant: "DALI Pivot",
          frameDepth: "3 5/32″ - 80mm",
          priceVariation: "Base",
        },
      ],
    },
  },
};

const ProductTable = () => {
  return (
    <div className="p-4 flex gap-10 text-xs text-center zoomed-container">
      {Object.entries(products).map(([brand, lines]) => (
        <div key={brand} className="mb-8">
          <div className="w-full flex justify-center py-6">
            <Image
              src={`/assets/logos/${brand.toLowerCase()}-logo.svg`}
              alt="Logo"
              height={33}
              width={150}
              className="h-8 w-auto"
            />
          </div>
          <div className="overflow-x-auto border border-primaryN30 rounded-xl">
            <table className="min-w-full ">
              <thead className="bg-primaryN30">
                <tr className="font-medium text-grey-normal">
                  <th className="w-32 border border-primaryN30">Line</th>
                  <th className="w-32 border border-primaryN30">Sub Brand</th>
                  <th className="w-32 border border-primaryN30">Variant</th>
                  <th className="w-32 border border-primaryN30">Frame Depth</th>
                  <th className="w-32 py-1 border border-primaryN30">
                    <p>Price Variation</p>
                    <p className="font-normal">(over the base)</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(lines).map(
                  ([lineName, subBrands], lineIndex) => (
                    <React.Fragment key={lineName}>
                      {Object.entries(subBrands).map(
                        ([subBrand, variants], subIndex) =>
                          variants.map((variant, index) => {
                            const rowClass =
                              (lineIndex + subIndex + index) % 2 === 1
                                ? "bg-primaryN10"
                                : "bg-white";

                            return (
                              <tr
                                key={`${subBrand}-${variant.variant}`}
                                className={`border-t ${rowClass}`}
                              >
                                {index === 0 && subIndex === 0 && (
                                  <td
                                    className="px-4 py-2 border font-semibold"
                                    rowSpan={Object.values(subBrands).reduce(
                                      (acc, v) => acc + v.length,
                                      0,
                                    )}
                                  >
                                    {lineName}
                                  </td>
                                )}
                                {index === 0 && (
                                  <td
                                    className="px-4 py-2 border"
                                    rowSpan={variants.length}
                                  >
                                    {subBrand}
                                  </td>
                                )}
                                <td className="px-4 py-2 border">
                                  {variant.variant}
                                </td>
                                <td className="px-4 py-2 border">
                                  {variant.frameDepth}
                                </td>
                                <td className="px-4 py-2 border">
                                  {variant.priceVariation}
                                </td>
                              </tr>
                            );
                          }),
                      )}
                    </React.Fragment>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const PriceRangeModal = ({
  isOpen,
  close,
}: {
  isOpen: boolean;
  close: () => void;
}) => {
  return (
    <Modal open={isOpen} onCancel={close} footer={null} width={1250} centered>
      <div className="w-full flex justify-center px-10 flex-col items-center pt-10">
        <div className="text-sm flex flex-col gap-4 w-9/12 self-start">
          <p className="text-primaryN900 font-semibold">Price Range</p>
          <p>
            An estimate value for your Quotii, as{" "}
            <span className="underline">
              costs may vary depending on the selected profiles
            </span>
            . Profile selection will be finalized as our team works with you
            throughout the project. For high-level budgeting, we&apos;ve made
            initial assumptions.
          </p>
          <p className="font-semibold">
            Estimated price differences if other profiles are chosen:
          </p>
        </div>
        <ProductTable />
      </div>
    </Modal>
  );
};

export default PriceRangeModal;
