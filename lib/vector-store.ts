import {
  CouchbaseSearchVectorStore,
  CouchbaseSearchVectorStoreArgs,
} from "@langchain/community/vectorstores/couchbase_search";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createCouchbaseCluster } from "@/lib/couchbase-connection";

// Ingestion and retrieval must embed with the same model: vectors from
// different models live in different spaces, so a query embedded with one
// model cannot reliably find chunks stored with another (even when the
// dimensions match). Keep the model choice here, in one place.
export const EMBEDDING_MODEL = "text-embedding-3-small";

// Field names must match the Search index definition in README.md.
const TEXT_KEY = "text";
const EMBEDDING_KEY = "embedding";

/**
 * Connects to Couchbase and returns the vector store used by both the
 * PDF ingestion route and the chat route.
 */
export async function getVectorStore(): Promise<CouchbaseSearchVectorStore> {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: EMBEDDING_MODEL,
  });

  const cluster = await createCouchbaseCluster();
  if (!cluster) {
    throw new Error("Couchbase cluster connection failed");
  }

  const config: CouchbaseSearchVectorStoreArgs = {
    cluster,
    bucketName: process.env.DB_BUCKET || "",
    scopeName: process.env.DB_SCOPE || "",
    collectionName: process.env.DB_COLLECTION || "",
    indexName: process.env.INDEX_NAME || "",
    textKey: TEXT_KEY,
    embeddingKey: EMBEDDING_KEY,
    scopedIndex: true,
  };

  return CouchbaseSearchVectorStore.initialize(embeddings, config);
}
