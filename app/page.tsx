"use client";

import { useCallback, useState } from "react";
import PDFUploader from "@/components/PDFUploader";
import { InfoCard } from "@/components/InfoCard";
import Image from "next/image";

export default function Home({ docsList }: { docsList: any }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex flex-col gap-4 container mt-10">
      <InfoCard />
      <h1 className="text-4xl leading-[1.1] tracking-tighter font-medium text-center mt-10">
        Chat With Your PDFs using power of couchbase vector search
      </h1>
      <div className="mx-auto min-w-[450px] flex justify-center">
        <PDFUploader />
      </div>
    </div>
  );
}
