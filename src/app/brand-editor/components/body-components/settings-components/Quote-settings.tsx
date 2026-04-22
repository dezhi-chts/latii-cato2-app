"use client";

import { div } from "framer-motion/m";
import FormulasBox from "./Formulas-Box";

const QuoteSettings = () => {
  return (
    <div className="flex gap-20 mb-10 mt-[-20px] text-xs">
      {/* Primera Mitad */}

      <div className="w-7/12">
        <p className="text-base text-grey-dark">Quote Information</p>
        <p className="text-grey-light-strong">
          This is the quote information requested for all quotes.
        </p>
        <div className="w-full flex flex-col items-center mt-8">
          {/* Pricing */}

          <div className="w-11/12">
            <p className="text-base text-grey-dark">Pricing</p>
            <p className="text-grey-light-strong">
              Customize these formulas to your needs. Note that you can still
              edit the final totals on each quote. Max create 6 fields.
            </p>
            <div>
              <FormulasBox label="prueba" />
            </div>
          </div>

          {/* Quote PDF Information */}
          <div className="mt-8 w-11/12">
            <p className="text-base text-grey-dark">Quote PDF Information</p>
            <p className="text-grey-light-strong">
              Information will be shown on the downloadable quote.{" "}
            </p>
          </div>
        </div>
      </div>
      {/* Segunda Mitad */}

      <div className="w-5/12">
        <p className="text-base text-grey-dark">Quote PDF Review</p>
        <p className="text-grey-light-strong">
          Edits reflect immediately in the preview and sync across all PDF
          output formats
        </p>
      </div>
    </div>
  );
};

export default QuoteSettings;
