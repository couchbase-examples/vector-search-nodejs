/* eslint-disable react/no-unescaped-entities */
export const InfoCard = () => (
  <div className="p-4 md:p-8 rounded bg-[#dddddd] w-full max-h-[85%] overflow-hidden">
    <h1 className="text-2xl md:text-4xl mb-4">
      PDF Chat Demo using Couchbase, NextJS, Langchain, and OpenAI
    </h1>
    <ul className="text-sm sm:text-base md:text-lg">
      <li className="text-l">
        {">"}
        <span className="ml-2">
        This is a PDF chat app through which ask questions, get summaries, find information, and more from any PDF.
        </span>
      </li>

      <li className="text-l mt-2">
      {">"}
        <span className="ml-2">
          For RAG, we are using{" "}
          <a
            href="https://www.couchbase.com/products/vector-search/Couchbase"
            target="_blank"
            className="text-blue-500"
          >
            Couchbase Vector Search
          </a>{" "}
          ,{" "}
          <a
            href="https://js.langchain.com/"
            target="_blank"
            className="text-blue-500"
          >
            LangChain.js
          </a>{" "}
          &{" "}
          <a
            href="https://openai.com/"
            target="_blank"
            className="text-blue-500"
          >
            OpenAI
          </a>{" "}
          . We fetch parts of the PDF relevant to the question using Vector
          search & add it as the context to the LLM. The LLM is instructed to
          answer based on the context from the Vector Store.
        </span>
      </li>
      
      <li className="text-l mt-2">
        {">"}
        <span className="ml-2">
          This code for this demo is open source - you can see the source code, learn more about using couchbase vector store and deploy
          your own version{" "}
          <a
            href="https://github.com/couchbase-examples/vector-search-nodejs"
            target="_blank"
            className="text-blue-500"
          >
            from the GitHub repo
          </a>
          !
        </span>
      </li>
    </ul>
  </div>
);
