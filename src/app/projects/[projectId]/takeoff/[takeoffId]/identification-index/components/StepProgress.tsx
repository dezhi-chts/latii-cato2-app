import { useMemo } from "react";
import Image from "next/image";
const StepProgress = ({
  currentStep,
}: {
  currentStep: number;
}) => {
  const stepList = [{
    imageList: ["/assets/icons/step-doing.svg", "/assets/icons/step-undo.svg", "/assets/icons/step-undo.svg"],
    lineColor: ["bg-loadingGray", "bg-loadingGray"],
    stepTitleColor: ["text-forumBlue", 'text-basicLightGray', 'text-basicLightGray'],
  }, {
    imageList: ["/assets/icons/step-done.svg", "/assets/icons/step-doing.svg", "/assets/icons/step-undo.svg"],
    lineColor: ["bg-forumBlue", "bg-loadingGray"],
    stepTitleColor: ["text-forumBlue66", 'text-forumBlue', 'text-basicLightGray'],
  },
  {
    imageList: ["/assets/icons/step-done.svg", "/assets/icons/step-done.svg", "/assets/icons/step-doing.svg"],
    lineColor: ["bg-forumBlue", "bg-forumBlue"],
    stepTitleColor: ["text-forumBlue66", 'text-forumBlue66', 'text-basicLightGray'],
  }
  ];

  const stepInfo = useMemo(() => {
    if (currentStep > 1 && currentStep <= stepList.length) {
      return stepList[currentStep - 1];
    }
    return stepList[0];
  }, [currentStep])

  return (
    <div className="w-[850px] flex flex-col">
      <div className="ml-[120px] w-[560px] h-[20px] flex flex-row items-center">
        <Image src={stepInfo.imageList[0]} alt="step icon" width={18} height={18} />
        <div className={`w-[268px] h-[2px] ${stepInfo.lineColor[0]}`} />
        <Image src={stepInfo.imageList[1]} alt="step icon" width={18} height={18} />
        <div className={`w-[268px] h-[2px] ${stepInfo.lineColor[1]}`} />
        <Image src={stepInfo.imageList[2]} alt="step icon" width={18} height={18} />
      </div>
      <div className="w-full flex flex-row">
        <div className="w-[250px]">
          <div className="w-full text-center">
            <span className={`text-sm ${stepInfo.stepTitleColor[0]}`}>Page Index</span>
            <span className="ml-2 text-xs text-baseGray">Step 1</span>
          </div>
          <div className={`mt-1 ml-[20px] text-xs text-basicGray ${currentStep === 1 ? 'opacity-100' : 'opacity-0'}`}>Index pages to improve AI analysis.</div>
        </div>
        <div className="w-[280px]">
          <div className="w-full text-center">
            <span className={`text-sm ${stepInfo.stepTitleColor[1]}`}>Page Labeling</span>
            <span className="ml-2 text-xs text-baseGray">Step 2</span>
          </div>
          <div className={`mt-1 ml-[40px] text-xs text-basicGray ${currentStep === 2 ? 'opacity-100' : 'opacity-0'}`}>Label your files for accurate results</div>
        </div>
        <div className="w-[280px]">
          <div className="w-full text-center">
            <span className={`text-sm ${stepInfo.stepTitleColor[2]}`}>Pre-Analysis</span>
            <span className="ml-2 text-xs text-baseGray">Step 3</span>
          </div>
          <div className={`mt-1 ml-[50px] text-xs text-basicGray ${currentStep === 3 ? 'opacity-100' : 'opacity-0'}`}>Label your files for accurate results</div>
        </div>
      </div>
    </div>
  );
};

export default StepProgress;