"use client";

import { div } from "framer-motion/m";

const QuoteSettings = () => {
  return (
    <div className="flex gap-20 mb-10 mt-[-20px] text-xs">
      <div className="w-7/12">
        <p className="text-base text-baseDark">Quote Information</p>
        <p className="text-baseGray">
          This is the quote information requested for all quotes.
        </p>
        <div className="w-full flex flex-col items-center mt-8">
          {/* Pricing */}

          <div className="w-11/12">
            <p className="text-base text-baseDark">Pricing</p>
            <p className="text-baseGray">
              Customize these formulas to your needs. Note that you can still
              edit the final totals on each quote. Max create 6 fields.
            </p>
          </div>

          {/* Quote PDF Information */}
          <div className="mt-8 w-11/12">
            <p className="text-base text-baseDark">Quote PDF Information</p>
            <p className="text-baseGray">
              Information will be shown on the downloadable quote.{" "}
            </p>
          </div>
        </div>
      </div>
      {/* Segunda Mitad */}

      <div className="w-5/12">
        <p>Quote PDF Review</p>
        <p>
          Edits reflect immediately in the preview and sync across all PDF
          output formats
        </p>
      </div>
    </div>
  );
};

export default QuoteSettings;
