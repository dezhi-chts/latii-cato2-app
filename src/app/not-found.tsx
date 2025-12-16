"use client";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

const NotFound = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-screen bg-slate-800">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-red-400">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-200">
          {"Sorry, we couldn't find the page you're looking for."}
        </p>
        <Button
          variant="outline"
          className="px-10"
          onClick={() => router.push("/")}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
