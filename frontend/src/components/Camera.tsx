import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, RotateCcw, Check } from 'lucide-react';

interface CameraProps {
  onCapture: (imageBase64: string) => void;
}

export default function Camera({ onCapture }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  const confirm = () => {
    if (imgSrc) {
      // Return base64 without the prefix data:image/jpeg;base64,
      const base64Data = imgSrc.split(',')[1];
      onCapture(base64Data);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt="Captured" className="object-cover w-full h-full" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="object-cover w-full h-full"
          />
        )}
      </div>

      <div className="flex justify-center gap-4">
        {imgSrc ? (
          <>
            <button
              onClick={retake}
              className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" /> Retake
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Check className="w-5 h-5" /> Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={capture}
            className="flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-dark text-white rounded-full font-medium transition-colors shadow-lg"
          >
            <CameraIcon className="w-6 h-6" /> Take Photo
          </button>
        )}
      </div>
    </div>
  );
}
