"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const PDFUploader = ({ router }: { router: NextRouter }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const uploadPdf = async (event: any) => {
    event.preventDefault();
    if (selectedFile === null) {
      alert("Please select a pdf file to upload");
      return;
    }
    const data = new FormData();
    data.set("file", selectedFile);

    const response = await fetch("/api/ingestPdf", {
      method: "POST",
      body: data,
    });
    console.log(response);
    router.push({
      pathname: "/chatPage",
      query: {
        response: await response.json(),
      },
    });
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
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mt-4"
        onClick={(event) => uploadPdf(event)}
      >
        Upload
      </button>
    </div>
  );
};

export default PDFUploader;
