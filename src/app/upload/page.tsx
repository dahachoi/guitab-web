"use client";

import { useState } from "react";
import AudioUpload from "@/components/ui/audioUpload";
import AudioTrimmer from "@/components/ui/audioTrimmer";
import Button from "@/components/ui/button";

// Define app states to control the flow
type AppState = "upload" | "trim" | "processing" | "results";

export default function UploadPage() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 0]);

  // Handle file upload completion
  const handleFileUploaded = (file: File) => {
    setAudioFile(file);
    setAppState("trim");
  };

  // Handle trim completion
  const handleTrimComplete = (start: number, end: number) => {
    setTrimValues([start, end]);
    setAppState("processing");
    
    // Simulate processing (replace with actual API call)
    setTimeout(() => {
      setAppState("results");
    }, 3000);
  };

  // Reset the flow
  const handleReset = () => {
    setAppState("upload");
    setAudioFile(null);
    setTrimValues([0, 0]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-6">AI Guitar Tab Generator</h1>
      
      <p className="text-center mb-8">
        Upload your song audio file and our AI will generate guitar tabs for you. 
        The process may take a few minutes depending on the length and complexity of the song.
      </p>
      
      {appState === "upload" && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center mb-4">Upload Your Song</h2>
          <AudioUpload onFileUploaded={handleFileUploaded} />
        </div>
      )}
      
      {appState === "trim" && audioFile && (
        <div>
          <AudioTrimmer 
            audioFile={audioFile}
            onTrimComplete={(start, end) => handleTrimComplete(start, end)}
          />
        </div>
      )}
      
      {appState === "processing" && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg">Processing your audio and generating tabs...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few minutes.</p>
        </div>
      )}
      
      {appState === "results" && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Your Guitar Tabs</h2>
          {/* Display tabs here */}
          <div className="bg-gray-100 p-6 rounded-lg mb-6 text-left font-mono">
            <pre>{`
e |-----0-----0-----0-----0-----|
B |---0-----0-----0-----0-------|
G |-0-----0-----0-----0---------|
D |------------------------2----|
A |------------------------3----|
E |------------------------0----|
            `}</pre>
          </div>
          <Button onClick={handleReset}>Start Over</Button>
        </div>
      )}
    </div>
  );
}