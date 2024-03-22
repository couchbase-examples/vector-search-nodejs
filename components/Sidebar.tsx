import { InfoCard } from "./InfoCard";
import PDFUploader from "./PDFUploader";

export const Sidebar = ({isOpen}:{
    isOpen: boolean
}) => (
  <div className={`h-screen fixed z-30 top-0 left-0 bg-white overflow-x-hidden transition-all duration-200 pt-16 ${isOpen ? "w-96" : "w-0"}`} >
    <InfoCard />
    <div className="mt-14 mx-2 mb-10">
        <h2 className="text-2xl text-center">Start Over with a new PDF!!</h2>
        <PDFUploader />
    </div>
    
  </div>
);
