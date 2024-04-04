import {
  CouchbaseVectorStore,
  CouchbaseVectorStoreArgs,
} from "@langchain/community/vectorstores/couchbase";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createCouchbaseCluster } from "@/lib/couchbase-connection";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { HumanMessage, AIMessage, ChatMessage } from "@langchain/core/messages";
import {
  RunnableSequence,
  RunnablePick
} from "@langchain/core/runnables";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { Document } from '@langchain/core/documents';

const formatVercelMessages = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    console.warn(
      `Unknown message type passed: "${message.role}". Falling back to generic message type.`
    );
    return new ChatMessage({ content: message.content, role: message.role });
  }
};

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages ?? [];
  if (!messages.length) {
    throw new Error("No messages provided.");
  }
  const formattedPreviousMessages = messages
    .slice(0, -1)
    .map(formatVercelMessages);

  const currentMessageContent = messages[messages.length - 1].content;
  try {
    const model = new ChatOpenAI({});
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Given the above conversation, generate a concise vector store search query to look up in order to get information relevant to the conversation.",
      ],
    ]);

    const ANSWER_SYSTEM_TEMPLATE = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
      If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
      If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
      
      <context>
      {context}
      </context>
      
      Please return your answer in markdown with clear headings and lists.`;

    const answerPrompt = ChatPromptTemplate.fromMessages([
      ["system", ANSWER_SYSTEM_TEMPLATE],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
    ]);

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
    const couchbaseVectorStore = await CouchbaseVectorStore.initialize(
      embeddings,
      couchbaseConfig
    );

    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const retriever = couchbaseVectorStore.asRetriever({
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            // Extract retrieved source documents so that they can be displayed as sources
            // on the frontend.
            resolveWithDocuments(documents);
          },
        },
      ],
    }
    );

    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
      llm: model,
      retriever,
      rephrasePrompt: historyAwarePrompt,
    });

    // Create a chain that answers questions using retrieved relevant documents as context.
    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt: answerPrompt,
    });

    // Create a chain that combines the above retriever and question answering chains.
    const conversationalRetrievalChain = await createRetrievalChain({
      retriever: historyAwareRetrieverChain,
      combineDocsChain: documentChain,
    });

    // "Pick" the answer from the retrieval chain output object and stream it as bytes.
    const outputChain = RunnableSequence.from([
      conversationalRetrievalChain,
      new RunnablePick({ keys: "answer" }),
      new HttpResponseOutputParser({ contentType: "text/plain" }),
    ]);

    const stream = await outputChain.stream({
      chat_history: formattedPreviousMessages,
      input: currentMessageContent,
    });

    const documents = await documentPromise;
    const serializedSources = Buffer.from(
      JSON.stringify(
        documents.map((doc) => {
          return {
            pageContent: doc.pageContent.slice(0, 50) + '...',
            metadata: doc.metadata,
          };
        }),
      ),
    ).toString('base64');

    return new StreamingTextResponse(stream, {
      headers: {
        'x-message-index': (formattedPreviousMessages.length + 1).toString(),
        'x-sources': serializedSources,
      },
    });

  } catch (err) {
    console.log("Error Received ", err);
  }
}
