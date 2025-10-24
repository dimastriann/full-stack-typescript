import { X } from 'lucide-react';
import { useState } from 'react';

export default function ErrorSection({
  errorMessage,
  close,
}: {
  errorMessage: string;
  close: (val: string) => void;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyCliboard = async () => {
    await navigator.clipboard.writeText(errorMessage);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <>
      <div className="border-red-600 border-[1px] rounded-md my-2 p-2 bg-red-100 relative">
        <div className="text-red-600">
          {errorMessage}
          <X
            className="cursor-pointer text-black absolute top-1 right-1 size-5"
            onClick={() => close('')}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <div
            className="cursor-pointer bg-blue-600 px-2 py-1 text-white rounded-md"
            onClick={copyCliboard}
          >
            Copy to Clipboard
          </div>
          {isCopied ? (
            <div className="text-green-600 px-2 py-1">Copied Success.</div>
          ) : null}
        </div>
      </div>
    </>
  );
}
