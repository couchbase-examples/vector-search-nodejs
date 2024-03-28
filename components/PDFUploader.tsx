"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader } from "./Loader";

const PDFUploader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles[0]);
    setSelectedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    }, // Accept only PDF files
    maxSize: 100 * 1024 * 1024, // Limit file size to 100MB
    maxFiles: 1,
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const uploadPdf = async (event: any) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    if (selectedFile === null) {
      alert("Please select a pdf file to upload");
      return;
    }
    setIsLoading(true);
    const data = new FormData();
    data.set("file", selectedFile);

    try {
      const response = await fetch("/api/ingestPdf", {
        method: "POST",
        body: data,
      });
      const jsonResp = await response.json();

      router.push(
        "/chatPage" + "?" + createQueryString("fileName", jsonResp.fileName)
      );
    } catch (error) {
      console.error(`Error uploading pdf`, error);
      throw new Error(`Error uploading pdf: ${error}`);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        {...getRootProps()}
        className="border border-dashed border-gray-300 p-4 h-32"
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag & drop your PDF here, or click to select one
        </p>
      </div>
      {selectedFile && (
        <p className="mt-2 text-gray-600">Selected file: {selectedFile.name}</p>
      )}
      <button
        type="button"
        className={`font-semibold py-2 px-4 rounded mt-4 flex items-center justify-center h-12 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
        onClick={uploadPdf}
        disabled={isLoading}
      >
        {!isLoading ? "Upload" : <Loader />}
      </button>
    </div>
  );
};

export default PDFUploader;
