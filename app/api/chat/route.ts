import {
  CouchbaseSearchVectorStore,
} from "@langchain/community/vectorstores/couchbase_search";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createCouchbaseCluster } from "@/lib/couchbase-connection";
import { Message as VercelChatMessage } from "ai";
import { HumanMessage, AIMessage, ChatMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "@langchain/classic/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { Document } from '@langchain/core/documents';
import {NextResponse} from 'next/server';

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
  // Load environment variables explicitly
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

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
    const model = new ChatOpenAI({
      model: "gpt-4",
      openAIApiKey: openaiApiKey,
    });
    const embeddings = new OpenAIEmbeddings({
      apiKey: openaiApiKey,
      model: "text-embedding-3-small",
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

    if (!cluster) {
      throw new Error("Couchbase cluster connection failed");
    }

    const couchbaseConfig = {
      cluster,
      bucketName,
      scopeName,
      collectionName,
      indexName,
      textKey,
      embeddingKey,
      scopedIndex,
    };
    const couchbaseSearchVectorStore = await CouchbaseSearchVectorStore.initialize(
      embeddings,
      couchbaseConfig
    );

    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const retriever = couchbaseSearchVectorStore.asRetriever({
      searchType: "similarity",
      searchKwargs: { k: 4 },
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            // Extract retrieved source documents so that they can be displayed as sources
            // on the frontend.
            resolveWithDocuments(documents);
          },
        },
      ],
    });

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
    // Skip history-aware retriever for now to debug the issue
    const conversationalRetrievalChain = await createRetrievalChain({
      retriever: retriever,
      combineDocsChain: documentChain,
    });

    // "Pick" the answer from the retrieval chain output object and stream it as bytes.
    const outputChain = conversationalRetrievalChain.pick("answer")

    const stream = await outputChain.stream({
      chat_history: formattedPreviousMessages,
      input: currentMessageContent,
    });
    

    const documents = await documentPromise;
    console.log("Documents: ", documents);
    
    const serializedSources =  Buffer.from(
      JSON.stringify(
        documents.map((doc) => {
          return {
            pageContent: doc.pageContent.slice(0, 50) + '...',
            metadata: doc.metadata,
          };
        }),
      ),
    ).toString('base64');

    const byteStream = stream.pipeThrough(new TextEncoderStream());

    return new Response(byteStream, {
      headers: {
        'x-message-index': (formattedPreviousMessages.length + 1).toString(),
        'x-sources': serializedSources,
      },
      
    })

  } catch (err) {
    console.log("Error Received ", err);
    return NextResponse.json({ error: "Failed to process chat message" });
  }
}
