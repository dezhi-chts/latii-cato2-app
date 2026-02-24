import Settings from "../brand-editor/components/body-components/settings";

const BrandSettings = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="w-full flex flex-col gap-2 border-b-baseLightHover border-b pl-12 pt-10 pb-6">
        <div className="flex flex-col  ">
          <p className="text-basicGray text-lg">Settings</p>
          <p className="text-sm text-baseGray">
            Set the data you want to recollect from your projects, keep it
            organized.
          </p>
        </div>
      </div>
      <div className="pl-6">
        <Settings />
      </div>
    </div>
  );
};

export default BrandSettings;
