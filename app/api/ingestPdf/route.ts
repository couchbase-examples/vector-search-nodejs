import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  CouchbaseVectorStore,
  CouchbaseVectorStoreArgs,
} from "@langchain/community/vectorstores/couchbase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createCouchbaseCluster } from "@/lib/couchbase-connection";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export async function POST(request: Request) {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create public/assets directory if it doesn't exist
    if (!existsSync(path.join(process.cwd(), "public/assets"))) {
      mkdirSync(path.join(process.cwd(), "public/assets"));
    }

    // Write file to public/assets directory
    await writeFile(
      path.join(process.cwd(), "public/assets", file.name),
      buffer
    );

    const loader = new PDFLoader(new Blob([buffer]));
    const rawDocs = await loader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(rawDocs);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const bucketName = process.env.DB_BUCKET || "";
    const scopeName = process.env.DB_SCOPE || "";
    const collectionName = process.env.DB_COLLECTION || "";
    const indexName = process.env.INDEX_NAME || "";
    const textKey = "text";
    const embeddingKey = "embedding";
    const scopedIndex = true;

    const cluster = await createCouchbaseCluster();
    const couchbaseConfig: CouchbaseVectorStoreArgs = {
      cluster,
      bucketName,
      scopeName,
      collectionName,
      indexName,
      textKey,
      embeddingKey,
      scopedIndex,
    };
    await CouchbaseVectorStore.fromDocuments(docs, embeddings, couchbaseConfig);

    console.log("creating vector store...");
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Failed to ingest your data" });
  }

  return NextResponse.json({
    text: "Successfully embedded pdf",
    fileName: file.name,
  });
}
