import Image from "next/image";
import { useEffect, useState } from "react";

export const BuildingBackground = ({
  isDone = false,
  onFinish,
  totalDuration = 12000,
}: {
  isDone?: boolean;
  onFinish?: () => void;
  totalDuration?: number;
}) => {
  return (
    <div className="h-screen w-screen z-[5000] bg-white absolute top-0 left-0 overflow-hidden flex justify-center items-center">
      <div className="w-full flex justify-end absolute">
        <Image
          src="/assets/cato-images/building-background.png"
          alt="building background"
          width={1900}
          height={1600}
          className="w-3/4 h-auto"
        />
      </div>
      <div className="w-[500px] flex flex-col gap-2 items-center">
        <ProgressSpinner
          isDone={isDone}
          onFinish={onFinish}
          totalDuration={totalDuration}
        />
        <p className="text-xl text-forumBlue-normal">
          Building Your Takeoff List...
        </p>
        <p className="text-center">
          Our AI is now creating your item list. This can take a few minutes, so
          feel free to step away while we handle the heavy lifting.
        </p>
        <p className="text-sm text-grey-normal">Estimated time: 2-5 minutes</p>
      </div>
    </div>
  );
};

const ProgressSpinner = ({
  isDone = false,
  onFinish,
  totalDuration = 12000,
}: {
  isDone?: boolean;
  onFinish?: () => void;
  totalDuration?: number;
}) => {
  const [progress, setProgress] = useState(0);
  const totalDots = 8;

  const TOTAL_DURATION_MS = totalDuration;
  const DONE_SPEED_MULTIPLIER = 12;
  const INTERVAL_MS = 100;

  useEffect(() => {
    const steps = TOTAL_DURATION_MS / INTERVAL_MS;
    const increment = 100 / steps;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        return isDone
          ? Math.min(prev + increment * DONE_SPEED_MULTIPLIER, 100)
          : prev + increment;
      });
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isDone]);

  const activeDots = isDone
    ? Math.round((progress / 100) * totalDots)
    : Math.min(Math.round((progress / 100) * (totalDots - 1)), totalDots - 1);

  if (activeDots === totalDots && onFinish) onFinish();

  return (
    <div className="relative w-16 h-16 flex items-center justify-center mb-2 scale-75">
      {Array.from({ length: totalDots }).map((_, i) => {
        const angle = (i / totalDots) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * 28;
        const y = Math.sin(angle) * 28;

        return (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full ${
              i < activeDots
                ? "bg-forumBlue-normal"
                : "bg-loadingGray animate-pulse"
            }`}
            style={{ transform: `translate(${x}px, ${y}px)` }}
          />
        );
      })}
    </div>
  );
};

export default ProgressSpinner;
