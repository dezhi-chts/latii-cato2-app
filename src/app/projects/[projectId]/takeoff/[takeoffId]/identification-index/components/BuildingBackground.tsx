import Image from "next/image";
import { useEffect, useState } from "react";
import { Progress } from "antd";

const CircleProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startProgress = () => {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    };

    startProgress();

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Progress type="circle" percent={progress} showInfo={false} size={78} strokeWidth={5} strokeColor="#427CCE" trailColor="#ECF2FA" />
    </div>
  )
};

const InActiveCircle = () => {
  return <div className="w-[16px] h-[16px] rounded-full border boder-basicLightGray flex items-center justify-center">
    <div className="w-[5px] h-[5px] rounded-full bg-basicLightGray block">
    </div>
  </div>
}
const ActiveCircle = () => {
  return <div className="w-[16px] h-[16px] rounded-full bg-forumBlue flex items-center justify-center">
    <div className="w-[5px] h-[5px] rounded-full bg-white block">
    </div>
  </div>
}

const CircleProgressView = () => {
  return (
    <div className="w-[78px] flex items-center justify-center relative">
      <div className="absolute left-0 top-0">
        <CircleProgress />
      </div>
      <div className="mt-[24px] w-[32px] h-[32px] rounded-full bg-forumBlue flex items-center justify-center">
        <Image src="/assets/icons/step-loading.svg" alt="info circle icon" width={14} height={14}></Image>
      </div>
    </div>
  )
}

const PageIndexStepView = () => {
  return (
    <div className="w-full flex flex-col">
      <div className="px-[30px] flex flex-row relative">
        <CircleProgressView />
        <div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
        <div className={`ml-2 mt-[30px]`}><InActiveCircle /></div>
        <div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
        <div className={`ml-2 mt-[30px]`}><InActiveCircle /></div>

        <p className="absolute top-[60px] left-[280px] text-sm text-basicGray">Page Labeling</p>
        <p className="absolute top-[60px] left-[500px] text-sm text-basicGray">Pre-Analysis</p>
      </div>
      <div className="mt-10">
        <div className="w-[140px] text-center">
          <p className="text-xl text-forumBlue">Page Index</p>
          <p className="text-sm text-basicGray">Step 1</p>
        </div>
      </div>
    </div>
  )
}

const PageLabelStepView = () => {
  return (
    <div className="w-full flex flex-col">
      <div className="px-[30px] flex flex-row relative">
        <div className={`mt-[30px]`}><ActiveCircle /></div>
        <div className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
        <CircleProgressView />
        <div className={`ml-2 mt-[36px] w-[190px] h-[2px] bg-[#D9D9D9]`}></div>
        <div className={`ml-2 mt-[30px]`}><InActiveCircle /></div>

        <p className="absolute top-[60px] left-[-5px] text-sm text-forumBlue">Page Index</p>
        <p className="absolute top-[60px] left-[500px] text-sm text-basicGray">Pre-Analysis</p>
      </div>
      <div className="ml-[220px] mt-10">
        <div className="w-[140px] text-center">
          <p className="text-xl text-forumBlue">Page Labeling</p>
          <p className="text-sm text-basicGray">Step 2</p>
        </div>
      </div>
    </div>
  )
}

const PageAnalyzeStepView = () => {
  return (
    <div className="w-full flex flex-col">
      <div className="px-[30px] flex flex-row relative">
        <div className={`mt-[30px]`}><ActiveCircle /></div>
        <div className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-forumBlue`}></div>
        <div className={`mt-[30px]`}><ActiveCircle /></div>
        <div className={`mx-2 mt-[36px] w-[190px] h-[2px] bg-forumBlue`}></div>
        <CircleProgressView />

        <p className="absolute top-[60px] left-[-5px] text-sm text-forumBlue">Page Index</p>
        <p className="absolute top-[60px] left-[210px] text-sm text-forumBlue">Page Labeling</p>
      </div>
      <div className="ml-[450px] mt-10">
        <div className="w-[140px] text-center">
          <p className="text-xl text-forumBlue">Pre-Analysis</p>
          <p className="text-sm text-basicGray">Step 3</p>
        </div>
      </div>
    </div>
  )
}

const BuildingBackground = ({
  step,
}: {
  step: string;
}) => {
  const stepMap: any = {
    'page-index': {
      title: 'Processing your request...',
      subTitle: 'Please wait while we prepare your content.',
      description: '',
      stepComponent: <PageIndexStepView />
    },
    'page-label': {
      title: 'Cato Processing your request...',
      subTitle: 'Please wait while we prepare your content.',
      description: '',
      stepComponent: <PageLabelStepView />
    },
    'page-analyze': {
      title: 'CATO will build your Take Off Quote',
      subTitle: 'This can take a few minutes, so feel free to step away while we handle the heavy lifting.',
      description: 'Estimated time: 2-5 minutes',
      stepComponent: <PageAnalyzeStepView />
    }
  }

  const { title, subTitle, description, stepComponent } = stepMap[step] || stepMap['page-index'];

  return (
    <div className="h-screen w-screen z-[5000] fixed top-0 left-0 overflow-hidden flex justify-center items-center bg-white">
      <div className="w-full flex justify-end absolute">
        <Image
          src="/assets/cato-images/building-background.png"
          alt="building background"
          width={1900}
          height={1600}
          className="w-3/4 h-auto"
        />
      </div>
      <div className="w-[608px] flex flex-col items-center">
        <div className="text-[22px] text-forumBlue">{title}</div>
        <div className="mt-3 text-lg text-center">{subTitle}</div>
        {description && <div className="mt-8 text-sm text-basicGray">{description}</div>}
        <div className="mt-12 w-full">
          {stepComponent}
        </div>
      </div>
    </div>
  );
};

export default BuildingBackground;
