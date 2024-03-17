"use client";

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import type {
    ToolbarSlot,
    TransformToolbarSlot,
  } from '@react-pdf-viewer/toolbar';
  import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { useState } from 'react';

export const ChatPage = ({
    currentDoc,
  }: {
    currentDoc: Document;
  }) => {
    const [chatOnlyView, setChatOnlyView] = useState(false);
    const toolbarPluginInstance = toolbarPlugin();
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

    const pdfUrl = currentDoc.URL;

    const transform: TransformToolbarSlot = (slot: ToolbarSlot) => ({
        ...slot,
        Download: () => <></>,
        SwitchTheme: () => <></>,
        Open: () => <></>,
      });
  return (
    <div className="mx-auto flex flex-col no-scrollbar -mt-2">
      <div className="flex justify-between w-full lg:flex-row flex-col sm:space-y-20 lg:space-y-0 p-2">
        {/* Left hand side */}
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
          <div
            className={`w-full h-[90vh] flex-col text-white !important ${
              chatOnlyView ? "hidden" : "flex"
            }`}
          >
            <div
              className="align-center bg-[#eeeeee] flex p-1"
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
            </div>
            <Viewer
              fileUrl={pdfUrl as string}
              plugins={[toolbarPluginInstance, pageNavigationPluginInstance]}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
};
