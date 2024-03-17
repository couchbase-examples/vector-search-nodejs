import { NextResponse } from "next/server";
import {CouchbaseVectorStore, CouchbaseVectorStoreArgs} from "@langchain/community/vectorstores/couchbase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createCouchbaseCluster } from "@/lib/couchbase-connection";

export async function POST(request: Request) {
    const data = await request.formData();
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const bucketName = process.env.DB_BUCKET || "";
        const scopeName = process.env.DB_SCOPE || "";
        const collectionName = process.env.DB_COLLECTION || "";
        const indexName = process.env.INDEX_NAME || ""
        const textKey = "text"
        const embeddingKey = "embedding"
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
            scopedIndex
        }
        const couchbaseVectorStore = await CouchbaseVectorStore.initialize(embeddings,couchbaseConfig);
        const userMessage = data.get("userQuestion") ?? ""
        couchbaseVectorStore.similaritySearch("")
    } catch(err) {
        console.log("Error Received ", err);
    }
}