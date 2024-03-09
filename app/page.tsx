'use client';

import { useDropzone } from "react-dropzone";
import { useRouter } from 'next/navigation';
// import DocIcon from '@/components/ui/DocIcon';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useState } from 'react';
import PDFUploader from "@/components/PDFUploader";

export default function Home({ docsList }: { docsList: any }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // const UploadDropZone = () => (
  //   // <UploadDropzone
  //   //   uploader={uploader}
  //   //   options={options}
  //   //   onUpdate={(file) => {
  //   //     if (file.length !== 0) {
  //   //       setLoading(true);
  //   //       ingestPdf(
  //   //         file[0].fileUrl,
  //   //         file[0].originalFile.originalFileName || file[0].filePath,
  //   //       );
  //   //     }
  //   //   }}
  //   //   width="470px"
  //   //   height="250px"
  //   // />

  // );

  async function ingestPdf(fileUrl: string, fileName: string) {
    let res = await fetch('/api/ingestPdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        fileName,
      }),
    });

    let data = await res.json();
    router.push(`/document/${data.id}`);
  }

  return (
    <div className="mx-auto flex flex-col gap-4 container mt-10">
      <h1 className="text-4xl leading-[1.1] tracking-tighter font-medium text-center">
        Chat With Your PDFs
      </h1>
      {(
        <h2 className="text-3xl leading-[1.1] tracking-tighter font-medium text-center mt-5">
          Upload a new PDF below!
        </h2>
      )}
      <div className="mx-auto min-w-[450px] flex justify-center">
        {loading ? (
          <button
            type="button"
            className="inline-flex items-center mt-4 px-4 py-2 font-semibold leading-6 text-lg shadow rounded-md text-black transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Ingesting your PDF...
          </button>
        ) : (
          <PDFUploader />
        )}
      </div>
    </div>
  );
}
