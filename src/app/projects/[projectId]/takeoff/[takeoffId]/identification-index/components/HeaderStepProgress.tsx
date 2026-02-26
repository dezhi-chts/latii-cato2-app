const ActiveCircle = ({ number }: any) => {
  return (
    <div className="w-[16px] h-[16px] rounded-full border border-forumBlue-normal flex items-center justify-center">
      <div className="w-[14px] h-[14px] rounded-full bg-forumBlue-normal text-white text-xxs block text-center">
        {typeof number !== "undefined" ? number : ""}
      </div>
    </div>
  );
};

const InActiveCircle = () => {
  return (
    <div className="w-[16px] h-[16px] rounded-full bg-[#DCDCDC] flex items-center justify-center">
      <div className="w-[5px] h-[5px] rounded-full bg-white block"></div>
    </div>
  );
};

export const PageIndexStepActive = () => {
  return (
    <div className="h-full flex flex-row items-center gap-2">
      <ActiveCircle number={1} />
      <div className="text-sm text-forumBlue-normal">Page Index</div>
      <div className="text-xs text-grey-normal">Step 1</div>
    </div>
  );
};

export const PageIndexStepInActive = () => {
  return (
    <div className="pr-10 py-6 flex flex-row items-center gap-2 border-r border-primaryN30">
      <div
        className={`w-[16px] h-[16px] rounded-full cursor-pointer flex items-center justify-center bg-green-normal`}
      >
        <div className=" text-white text-xxs font-sans">{"✓"}</div>
      </div>
      <div className="text-sm text-green-normal">Page Index</div>
    </div>
  );
};

export const PageIndexStepCompleted = () => {
  return (
    <div className="pr-14 py-6 flex flex-row items-center gap-2 border-r border-primaryN30">
      <div
        className={`w-[16px] h-[16px] rounded-full cursor-pointer flex items-center justify-center bg-green-normal`}
      >
        <div className=" text-white text-xxs font-sans">{"✓"}</div>
      </div>
      <div className="text-sm text-green-normal">Page Index</div>
    </div>
  );
};

export const PageLabelingStepActive = () => {
  return (
    <div className="pl-6 h-full flex flex-row items-center gap-2">
      <ActiveCircle number={2} />
      <div className="text-sm text-forumBlue-normal">Page Labeling</div>
      <div className="text-xs text-grey-normal">Step 2</div>
    </div>
  );
};
export const PageLabelingStepInActive = () => {
  return (
    <div className="px-6 py-6 flex flex-row items-center gap-2 border-l border-primaryN30">
      <InActiveCircle />
      <div className="text-sm text-grey-light-strong">Page Labeling</div>
      <div className="text-xs text-grey-light-strong">Step 2</div>
    </div>
  );
};

// Completed step with green check for Page Labeling (used in Pre-Analysis step 3)
export const PageLabelingStepCompleted = () => {
  return (
    <div className="px-14 py-6 flex flex-row items-center gap-2 border-r border-primaryN30">
      <div className="w-[16px] h-[16px] rounded-full cursor-pointer flex items-center justify-center bg-green-normal">
        <div className="text-white text-xxs font-sans">{"✓"}</div>
      </div>
      <div className="text-sm text-green-normal">Page Labeling</div>
    </div>
  );
};

export const PageAnalysisStepActive = () => {
  return (
    <div className="h-full pl-14 flex flex-row items-center">
      <div className="text-sm text-forumBlue-normal">Page Analysis</div>
      <div className="text-xs text-grey-normal">Step 3</div>
    </div>
  );
};

export const PagePreAnalysisStepActive = () => {
  return (
    <div className="pl-10 h-full flex flex-row items-center gap-2">
      <ActiveCircle number={3} />
      <div className="text-sm text-forumBlue-normal">Pre-Analysis</div>
      <div className="text-xs text-grey-normal">Step 3</div>
    </div>
  );
};
export const PageAnalysisStepInActive = () => {
  return (
    <div className="px-6 py-6 flex flex-row items-center gap-2 border-l border-primaryN30">
      <InActiveCircle />
      <div className="text-sm text-grey-light-strong">Pre-Analysis</div>
      <div className="text-xs text-grey-light-strong">Step 3</div>
    </div>
  );
};

export const PagePreAnalysisStepCompleted = () => {
  return (
    <div className="px-14 py-6 flex flex-row items-center gap-2 border-r border-primaryN30">
      <div className="w-[16px] h-[16px] rounded-full cursor-pointer flex items-center justify-center bg-green-normal">
        <div className="text-white text-xxs font-sans">{"✓"}</div>
      </div>
      <div className="text-sm text-green-normal">Pre-Analysis</div>
    </div>
  );
};
