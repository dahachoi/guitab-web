// "use client";

// import { useState, useRef } from "react";
// import Button from "./button";

// interface AudioUploadProps {
//   onFileUploaded: (file: File) => void;
// }

// export default function AudioUpload({ onFileUploaded }: AudioUploadProps) {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploadMessage, setUploadMessage] = useState<string>("");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       handleFile(file);
//     }
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       const file = e.dataTransfer.files[0];
//       handleFile(file);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//   };

//   const handleFile = (file: File) => {
//     // Check if file is audio
//     if (!file.type.startsWith("audio/")) {
//       setUploadMessage("Please upload an audio file.");
//       return;
//     }
  
//     setSelectedFile(file);
//     setUploadMessage("File selected successfully!");
    
//     // Automatically proceed to trim by calling the callback
//     onFileUploaded(file);
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes < 1024) return bytes + " bytes";
//     else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
//     else return (bytes / 1048576).toFixed(2) + " MB";
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   const handleProceed = () => {
//     if (selectedFile) {
//       onFileUploaded(selectedFile);
//     }
//   };

//   return (
//     <div className="w-full">
//       <p className="text-center text-gray-600 mb-4">
//         Upload an audio file to generate guitar tabs
//       </p>
      
//       <div
//         className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
//         onClick={triggerFileInput}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//       >
//         <input
//           type="file"
//           ref={fileInputRef}
//           className="hidden"
//           accept="audio/*"
//           onChange={handleFileChange}
//         />
//         <Button onClick={triggerFileInput}>Choose File</Button>
//         <p className="mt-4 text-gray-500">or drag and drop your audio file here</p>
        
//         {selectedFile && (
//           <div className="mt-4 text-left">
//             <p>Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
//           </div>
//         )}
//       </div>
      
//       {uploadMessage && (
//         <div className={`mt-4 p-3 rounded ${uploadMessage.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//           {uploadMessage}
//         </div>
//       )}
    
//     </div>
//   );
// }

"use client";

import { useState, useRef } from "react";
import Button from "./button";

interface AudioUploadProps {
  onFileUploaded: (file: File) => void;
}

export default function AudioUpload({ onFileUploaded }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleFile = (file: File) => {
    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      setUploadMessage("Please upload an audio file.");
      return;
    }
    
    setSelectedFile(file);
    setUploadMessage("File selected successfully!");
    
    // Automatically proceed to trim by calling the callback
    onFileUploaded(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProceed = () => {
    if (selectedFile) {
      onFileUploaded(selectedFile);
    }
  };

  return (
    <div className="w-full">
      <p className="text-center text-gray-600 mb-4">
        Upload an audio file to generate guitar tabs
      </p>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center 
          transition-all duration-200 ease-in-out
          ${isDraggingOver 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:bg-gray-50 cursor-pointer'
          }
        `}
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
        />
        
        <div className={`
          transition-transform duration-200
          ${isDraggingOver ? 'scale-105' : ''}
        `}>
          <div className="mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke={isDraggingOver ? "#4F46E5" : "#9CA3AF"}
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
              />
            </svg>
          </div>
          
          <Button onClick={triggerFileInput}>Choose File</Button>
          
          <p className={`mt-4 transition-colors duration-200 ${
            isDraggingOver ? 'text-indigo-500 font-medium' : 'text-gray-500'
          }`}>
            {isDraggingOver ? 
              'Drop your audio file here' : 
              'or drag and drop your audio file here'
            }
          </p>
        </div>
        
        {selectedFile && (
          <div className="mt-4 text-left">
            <p>Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
          </div>
        )}
      </div>
      
      {uploadMessage && (
        <div className={`mt-4 p-3 rounded ${uploadMessage.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
}