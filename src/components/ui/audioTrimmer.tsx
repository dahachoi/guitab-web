// "use client";

// import { useState, useRef, useEffect } from "react";
// import Slider from "rc-slider";
// import "rc-slider/assets/index.css";
// import { Button } from "@/components/ui/button";

// interface AudioTrimmerProps {
//   audioFile: File;
//   onTrimComplete: (startTime: number, endTime: number) => void;
// }

// export default function AudioTrimmer({ audioFile, onTrimComplete }: AudioTrimmerProps) {
//   const [duration, setDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [playbackRate, setPlaybackRate] = useState(1);
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [audioUrl, setAudioUrl] = useState<string>("");
//   const [waveformData, setWaveformData] = useState<number[]>([]);
//   const timeUpdateListenerRef = useRef<(() => void) | null>(null);
//   const buttonRef = useRef<HTMLButtonElement | null>(null);
//   const [isDragging, setIsDragging] = useState(false);

//   const handleConvert = () => {
//     // Call the callback with current trim values
//     onTrimComplete(trimValues[0], trimValues[1]);
//   };    

//   // Calculate relative position within trimmed section
//   const getRelativePosition = () => {
//     if (currentTime < trimValues[0]) return 0;
//     if (currentTime > trimValues[1]) return trimValues[1] - trimValues[0];
//     return currentTime - trimValues[0];
//   };

//   // Calculate trimmed duration
//   const getTrimmedDuration = () => {
//     return trimValues[1] - trimValues[0];
//   };

//   useEffect(() => {
//     // Create object URL when file changes
//     const url = URL.createObjectURL(audioFile);
//     setAudioUrl(url);
    
//     // Process audio file to generate waveform data
//     generateWaveformData(audioFile);
    
//     return () => {
//       // Clean up URL on unmount
//       URL.revokeObjectURL(url);
//     };
//   }, [audioFile]);

//   const generateWaveformData = async (file: File) => {
//     const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
//     const reader = new FileReader();
    
//     reader.onload = async (e) => {
//       if (e.target?.result) {
//         try {
//           // Decode the audio file
//           const arrayBuffer = e.target.result as ArrayBuffer;
//           const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
//           // Get audio data from the left channel
//           const rawData = audioBuffer.getChannelData(0);
          
//           // Reduce data points for visualization (200 bars)
//           const samples = 200;
//           const blockSize = Math.floor(rawData.length / samples);
//           const filteredData = [];
          
//           for (let i = 0; i < samples; i++) {
//             let blockStart = blockSize * i;
//             let sum = 0;
            
//             // Find the maximum absolute value in this block
//             for (let j = 0; j < blockSize; j++) {
//               sum = Math.max(sum, Math.abs(rawData[blockStart + j]));
//             }
            
//             filteredData.push(sum);
//           }
          
//           setWaveformData(filteredData);
//         } catch (error) {
//           console.error("Error decoding audio data:", error);
//         }
//       }
//     };
    
//     reader.readAsArrayBuffer(file);
//   };

//   // We'll make sure we're getting enough timeupdate events by forcing updates
//   useEffect(() => {
//     // Update time display
//     const handleTimeUpdate = () => {
//       if (audioRef.current) {
//         // Force a re-render by setting the current time
//         setCurrentTime(audioRef.current.currentTime);
//       }
//     };

//     if (audioRef.current) {
//       // Make sure we get frequent updates
//       audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
//     }

//     return () => {
//       if (audioRef.current) {
//         audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
//       }
//     };
//   }, []);

//   const drawWaveform = () => {
//     const canvas = canvasRef.current;
//     if (!canvas || waveformData.length === 0 || duration === 0) return;
    
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;
    
//     // Clear the canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    
//     const canvasWidth = canvas.width;
//     const canvasHeight = canvas.height;
    
//     // Calculate visible duration within trim values
//     const visibleDuration = trimValues[1] - trimValues[0];
    
//     // Fixed number of bins to display (this will keep bin width consistent)
//     const numberOfBins = 150; // More bins for better resolution
    
//     // Calculate bin duration in seconds
//     const binDuration = visibleDuration / numberOfBins;
    
//     // Calculate bin width in pixels
//     const binWidth = canvasWidth / numberOfBins;
    
//     // Draw waveform - only show the trimmed section
//     for (let i = 0; i < numberOfBins; i++) {
//       // Calculate the time at the start and end of this bin
//       const binStartTime = trimValues[0] + (i * binDuration);
//       const binEndTime = binStartTime + binDuration;
      
//       // Find corresponding indices in waveformData
//       const startIdx = Math.floor((binStartTime / duration) * waveformData.length);
//       const endIdx = Math.ceil((binEndTime / duration) * waveformData.length);
      
//       // Calculate the maximum amplitude for this bin by checking all samples in the range
//       let maxAmplitude = 0;
//       for (let j = startIdx; j < endIdx && j < waveformData.length; j++) {
//         if (j >= 0 && j < waveformData.length) {
//           maxAmplitude = Math.max(maxAmplitude, waveformData[j] || 0);
//         }
//       }
      
//       // Add a minimum height for better visualization
//       maxAmplitude = Math.max(maxAmplitude, 0.05);
      
//       // Calculate bar height
//       const barHeight = maxAmplitude * canvasHeight * 0.8; // 80% of canvas height
      
//       // Determine if this bin is in the played portion relative to the trim
//       const isPlayed = binStartTime <= currentTime;
      
//       // Set color based on played status
//       if (isPlayed) {
//         ctx.fillStyle = '#000000'; // Black for played portion
//       } else {
//         ctx.fillStyle = '#cccccc'; // Light gray for unplayed portion
//       }
      
//       // Draw the bar
//       const x = i * binWidth;
//       ctx.fillRect(x, (canvasHeight - barHeight) / 2, binWidth - 1, barHeight);
//     }
    
//     // Draw current position marker - this is the blue vertical line that shows playback position
//     if (currentTime >= trimValues[0] && currentTime <= trimValues[1]) {
//       // Calculate position percentage within the visible (trimmed) range
//       const positionPercent = (currentTime - trimValues[0]) / (trimValues[1] - trimValues[0]);
//       const markerX = positionPercent * canvasWidth;
      
//       ctx.fillStyle = "#4F46E5"; // Blue marker (matching the slider color)
//       ctx.fillRect(markerX - 1, 0, 2, canvasHeight);
      
//       // Removed the circle at the marker position
//     }
    
//     // Draw time markers at the bottom
//     const timeMarkers = 5;
//     ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
//     ctx.font = "10px Arial";
    
//     for (let i = 0; i <= timeMarkers; i++) {
//       const position = (i / timeMarkers) * canvasWidth;
//       const time = trimValues[0] + (i / timeMarkers) * (trimValues[1] - trimValues[0]);
      
//       // Draw time marker
//       ctx.fillText(formatTime(time), position, canvasHeight - 5);
//     }
//   };

//   // Helper function to force a refresh of the waveform and playback indicator
//   // This can help ensure the visualization stays in sync with audio playback
//   const refreshWaveform = () => {
//     if (audioRef.current) {
//       // Get the current time directly from the audio element
//       const currentAudioTime = audioRef.current.currentTime;
//       // Update state to force redraw
//       setCurrentTime(currentAudioTime);
//     }
//   };

//   // Set up a timer to periodically refresh the waveform during playback
//   useEffect(() => {
//     let refreshTimer: number | null = null;
    
//     if (isPlaying) {
//       // Refresh every 100ms for smooth animation
//       refreshTimer = window.setInterval(refreshWaveform, 100);
//     }
    
//     return () => {
//       if (refreshTimer !== null) {
//         clearInterval(refreshTimer);
//       }
//     };
//   }, [isPlaying]);

//   // Separate useEffect for drawing the waveform when currentTime, waveformData, or trimValues change
//   useEffect(() => {
//     if (waveformData.length > 0 && duration > 0) {
//       drawWaveform();
//     }
//   }, [currentTime, waveformData, trimValues, duration]);

//   // Handle space bar for play/pause
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.code === 'Space') {
//         e.preventDefault(); // Prevent scrolling
//         togglePlayPause();
//       }
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
    
//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [isPlaying, trimValues]);

//   // Handle global mouse up events (for ending drag outside canvas)
//   useEffect(() => {
//     const handleGlobalMouseUp = () => {
//       setIsDragging(false);
//     };
    
//     window.addEventListener('mouseup', handleGlobalMouseUp);
    
//     return () => {
//       window.removeEventListener('mouseup', handleGlobalMouseUp);
//     };
//   }, []);

//   const handleMetadataLoaded = () => {
//     if (audioRef.current) {
//       const audioDuration = audioRef.current.duration;
//       setDuration(audioDuration);
//       setTrimValues([0, audioDuration]);
//     }
//   };

//   const handleTrimChange = (values: number | number[]) => {
//     if (Array.isArray(values) && values.length === 2) {
//       setTrimValues([values[0], values[1]]);
      
//       // If current position is outside new trim range, reset it
//       if (audioRef.current && (audioRef.current.currentTime < values[0] || audioRef.current.currentTime > values[1])) {
//         audioRef.current.currentTime = values[0];
//         setCurrentTime(values[0]);
//       }
//     }
//   };

//   // We'll maintain audio element events separately
//   useEffect(() => {
//     const handlePause = () => {
//       setIsPlaying(false);
//       console.log("Audio paused");
//     };
    
//     const handlePlay = () => {
//       setIsPlaying(true);
//       console.log("Audio playing");
//     };
    
//     const handleEnded = () => {
//       setIsPlaying(false);
//       console.log("Audio ended");
//     };

//     if (audioRef.current) {
//       audioRef.current.addEventListener('pause', handlePause);
//       audioRef.current.addEventListener('play', handlePlay);
//       audioRef.current.addEventListener('ended', handleEnded);
//     }

//     return () => {
//       if (audioRef.current) {
//         audioRef.current.removeEventListener('pause', handlePause);
//         audioRef.current.removeEventListener('play', handlePlay);
//         audioRef.current.removeEventListener('ended', handleEnded);
//       }
//     };
//   }, []);

//   const handleManualTrimChange = (type: 'start' | 'end', timeString: string) => {
//     // Convert MM:SS format to seconds
//     const parts = timeString.split(':');
//     if (parts.length === 2) {
//       const minutes = parseInt(parts[0]) || 0;
//       const seconds = parseInt(parts[1]) || 0;
//       const newTime = minutes * 60 + seconds;
      
//       if (type === 'start') {
//         // Validate range - start time must be less than end time and within duration
//         if (newTime >= 0 && newTime < trimValues[1] && newTime < duration) {
//           setTrimValues([newTime, trimValues[1]]);
//           if (audioRef.current && audioRef.current.currentTime < newTime) {
//             audioRef.current.currentTime = newTime;
//             setCurrentTime(newTime);
//           }
//         }
//       } else {
//         // Validate range - end time must be greater than start time and within duration
//         if (newTime > trimValues[0] && newTime <= duration) {
//           setTrimValues([trimValues[0], newTime]);
//         }
//       }
//     }
//   };

//   const setupTrimEndListener = () => {
//     if (audioRef.current) {
//       // Remove any existing listener
//       if (timeUpdateListenerRef.current) {
//         audioRef.current.removeEventListener('timeupdate', timeUpdateListenerRef.current);
//         timeUpdateListenerRef.current = null;
//       }
      
//       // Create new listener
//       const handleTimeUpdate = () => {
//         if (audioRef.current && audioRef.current.currentTime >= trimValues[1]) {
//           audioRef.current.pause();
//           audioRef.current.currentTime = trimValues[0]; // Reset to start of trim
//           setIsPlaying(false);
//           // Remove listener after pausing
//           if (timeUpdateListenerRef.current) {
//             audioRef.current.removeEventListener('timeupdate', timeUpdateListenerRef.current);
//             timeUpdateListenerRef.current = null;
//           }
//         }
//       };
      
//       // Store and add the new listener
//       timeUpdateListenerRef.current = handleTimeUpdate;
//       audioRef.current.addEventListener('timeupdate', timeUpdateListenerRef.current);
//     }
//   };

//   const togglePlayPause = () => {
//     if (audioRef.current) {
//       if (isPlaying) {
//         audioRef.current.pause();
//         setIsPlaying(false); // Force state update
//       } else {
//         // If current position is outside trim range, reset to start
//         if (audioRef.current.currentTime < trimValues[0] || audioRef.current.currentTime > trimValues[1]) {
//           audioRef.current.currentTime = trimValues[0];
//         }
        
//         setupTrimEndListener();
        
//         // Try to play and handle any errors
//         const playPromise = audioRef.current.play();
        
//         if (playPromise !== undefined) {
//           playPromise
//             .then(() => {
//               setIsPlaying(true);
//             })
//             .catch(err => {
//               console.error("Error playing audio:", err);
//               setIsPlaying(false);
//             });
//         } else {
//           // For older browsers that don't return a promise
//           setIsPlaying(true);
//         }
//       }
//     }
//   };

//   // Handle canvas clicks for seeking
//   const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (isDragging) return; // Don't handle clicks during drag
    
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     // Get click position relative to canvas
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const clickPosition = x / rect.width;
    
//     // Convert to time within the trimmed range
//     const newTime = trimValues[0] + (clickPosition * (trimValues[1] - trimValues[0]));
    
//     // Set the new time
//     if (audioRef.current) {
//       audioRef.current.currentTime = newTime;
//       setCurrentTime(newTime);
//     }
//   };

//   // Mouse down handler to start scrubbing
//   const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     setIsDragging(true);
//     updateTimeFromMousePosition(e);
//   };

//   // Mouse move handler for scrubbing
//   const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (!isDragging) return;
//     updateTimeFromMousePosition(e);
//   };

//   // Mouse up handler to end scrubbing
//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   // Mouse leave handler
//   const handleMouseLeave = () => {
//     // Optional: you can also end dragging when mouse leaves the canvas
//     // setIsDragging(false);
//   };

//   // Shared function to update time from mouse position
//   const updateTimeFromMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current;
//     if (!canvas || !audioRef.current) return;
    
//     // Get mouse position relative to canvas
//     const rect = canvas.getBoundingClientRect();
//     const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
//     const scrubPosition = x / rect.width;
    
//     // Convert to time within the trimmed range
//     const newTime = trimValues[0] + (scrubPosition * (trimValues[1] - trimValues[0]));
    
//     // Set the new time
//     audioRef.current.currentTime = newTime;
//     setCurrentTime(newTime);
//   };

//   const handlePlaybackRateChange = (newRate: number) => {
//     setPlaybackRate(newRate);
//     if (audioRef.current) {
//       audioRef.current.playbackRate = newRate;
//     }
//   };

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Modified to work with the relative (trimmed) position
//   const seekTo = (relativePosition: number | number[]) => {
//     if (audioRef.current && typeof relativePosition === 'number') {
//       // Convert relative position to absolute position
//       const absolutePosition = trimValues[0] + relativePosition;
//       audioRef.current.currentTime = absolutePosition;
//       setCurrentTime(absolutePosition); // Update state immediately
//     }
//   };

//   // SVG for Play icon
//   const PlayIcon = () => (
//     <svg width="40" height="40" viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
//       <circle cx="170" cy="170" r="160" stroke="black" strokeWidth="10" fill="white"/>
//       <path d="M130,100 L240,170 L130,240 Z" fill="black"/>
//     </svg>
//   );

//   // SVG for Pause icon
//   const PauseIcon = () => (
//     <svg width="40" height="40" viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
//       <circle cx="170" cy="170" r="160" stroke="black" strokeWidth="10" fill="white"/>
//       <rect x="115" y="100" width="30" height="140" fill="black"/>
//       <rect x="195" y="100" width="30" height="140" fill="black"/>
//     </svg>
//   );

//   return (
//     <div className="mt-6">
//       {/* More prominent "Trim Audio" header */}
//       <h2 className="text-3xl font-bold text-center mb-2">Trim Audio</h2>
      
//       {/* Display audio file name and total duration */}
//       <div className="text-center text-gray-600 mb-6">
//         <p>File: <span className="font-medium">{audioFile.name}</span></p>
//         <p className="mt-1">Total Duration: <span className="font-medium">{formatTime(duration)}</span></p>
//       </div>
      
//       {/* Hidden audio element - only render when audioUrl exists */}
//       {audioUrl ? (
//         <audio
//           ref={audioRef}
//           src={audioUrl}
//           onLoadedMetadata={handleMetadataLoaded}
//           className="hidden"
//         />
//       ) : null}
      
//       {/* Main container - removed relative positioning since we don't need volume control */}
//       <div>
//         {/* Main content centered, removed right padding since there's no volume control */}
//         <div className="max-w-2xl mx-auto">
//           {/* Waveform visualization */}
//           <div className="relative mb-4 bg-gray-100 rounded">
//             <canvas 
//               ref={canvasRef} 
//               width={600} 
//               height={120} 
//               className={`w-full h-32 rounded ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
//               onClick={handleCanvasClick}
//               onMouseDown={handleMouseDown}
//               onMouseMove={handleMouseMove}
//               onMouseUp={handleMouseUp}
//               onMouseLeave={handleMouseLeave}
//             />
//           </div>
          
//           {/* Current position and duration display - showing absolute time */}
//           <div className="flex justify-between mb-3 text-sm font-medium">
//             <span>Current: {formatTime(currentTime)}</span>
//             <span>Trim Duration: {formatTime(getTrimmedDuration())}</span>
//           </div>
          
//           {/* Progress bar */}
//           <div className="mb-6">
//             <Slider
//               min={0}
//               max={getTrimmedDuration()}
//               value={getRelativePosition()}
//               onChange={seekTo}
//               trackStyle={{ backgroundColor: '#4F46E5', height: 6 }}
//               railStyle={{ backgroundColor: '#E5E7EB', height: 6 }}
//               handleStyle={{
//                 borderColor: '#4F46E5',
//                 height: 16,
//                 width: 16,
//                 backgroundColor: 'white',
//               }}
//             />
//           </div>
          
//           {/* Play controls section - centered */}
//           <div className="mb-8">
//             {/* Icon-based play/pause button */}
//             <div className="flex justify-center mb-4">
//               <button
//                 ref={buttonRef}
//                 onClick={togglePlayPause}
//                 className="bg-transparent border-none cursor-pointer focus:outline-none"
//                 aria-label={isPlaying ? "Pause" : "Play"}
//               >
//                 {isPlaying ? <PauseIcon /> : <PlayIcon />}
//               </button>
//             </div>
            
//             {/* Playback rate */}
//             <div className="flex justify-center space-x-2">
//               {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
//                 <button
//                   key={rate}
//                   onClick={() => handlePlaybackRateChange(rate)}
//                   className={`px-3 py-1 rounded text-sm ${
//                     playbackRate === rate 
//                       ? 'bg-indigo-600 text-white' 
//                       : 'bg-gray-200 hover:bg-gray-300'
//                   }`}
//                 >
//                   {rate}x
//                 </button>
//               ))}
//             </div>
//           </div>
          
//           {/* Trim Range Section with manual time inputs */}
//           {duration > 0 && (
//             <div className="mb-8 border-t border-b py-6">
//               <h4 className="font-medium mb-4 text-center text-lg">Trim Range</h4>
              
//               {/* Manual time input fields */}
//               <div className="flex justify-between items-center mt-3 mb-4">
//                 <div className="flex flex-col">
//                   <label htmlFor="start-time" className="text-sm font-medium mb-1">Start Time</label>
//                   <input 
//                     id="start-time" 
//                     type="text" 
//                     value={formatTime(trimValues[0])} 
//                     onChange={(e) => handleManualTrimChange('start', e.target.value)}
//                     className="border rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     placeholder="0:00"
//                   />
//                 </div>
                
//                 <div className="flex flex-col items-center">
//                   <span className="text-sm font-medium mb-1">Duration</span>
//                   <span className="font-bold text-indigo-600">{formatTime(trimValues[1] - trimValues[0])}</span>
//                 </div>
                
//                 <div className="flex flex-col">
//                   <label htmlFor="end-time" className="text-sm font-medium mb-1">End Time</label>
//                   <input 
//                     id="end-time" 
//                     type="text" 
//                     value={formatTime(trimValues[1])} 
//                     onChange={(e) => handleManualTrimChange('end', e.target.value)}
//                     className="border rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     placeholder="0:00"
//                   />
//                 </div>
//               </div>
              
//               {/* Slider for visually adjusting trim range */}
//               <Slider
//                 range
//                 min={0}
//                 max={duration}
//                 value={trimValues}
//                 onChange={handleTrimChange}
//                 step={0.1}
//                 trackStyle={{ backgroundColor: '#10B981', height: 8 }}
//                 railStyle={{ backgroundColor: '#E5E7EB', height: 8 }}
//                 handleStyle={[
//                   {
//                     borderColor: '#10B981',
//                     height: 20,
//                     width: 20,
//                     backgroundColor: 'white',
//                   },
//                   {
//                     borderColor: '#10B981',
//                     height: 20,
//                     width: 20,
//                     backgroundColor: 'white',
//                   }
//                 ]}
//               />
//             </div>
//           )}
          
//           {/* Convert to Guitar Tabs button - centered at the bottom */}
//           <div className="mt-8 mb-4 flex justify-center">
//             <Button
//               onClick={handleConvert}
//               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg"
//             >
//               Convert to Guitar Tabs
//             </Button>
//           </div>
//         </div>
//       </div>
      
//       <div className="mt-4 text-center text-sm text-gray-500">
//         Supported formats: MP3, WAV, M4A, OGG (Max 20MB)
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useRef, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { Button } from "@/components/ui/button";

interface AudioTrimmerProps {
  audioFile: File;
  onTrimComplete: (startTime: number, endTime: number) => void;
}

export default function AudioTrimmer({ audioFile, onTrimComplete }: AudioTrimmerProps) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimValues, setTrimValues] = useState<[number, number]>([0, 100]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const timeUpdateListenerRef = useRef<(() => void) | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleConvert = () => {
    // Call the callback with current trim values
    onTrimComplete(trimValues[0], trimValues[1]);
  };    

  // Calculate relative position within trimmed section
  const getRelativePosition = () => {
    if (currentTime < trimValues[0]) return 0;
    if (currentTime > trimValues[1]) return trimValues[1] - trimValues[0];
    return currentTime - trimValues[0];
  };

  // Calculate trimmed duration
  const getTrimmedDuration = () => {
    return trimValues[1] - trimValues[0];
  };

  useEffect(() => {
    // Create object URL when file changes
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    
    // Process audio file to generate waveform data
    generateWaveformData(audioFile);
    
    return () => {
      // Clean up URL on unmount
      URL.revokeObjectURL(url);
    };
  }, [audioFile]);

  const generateWaveformData = async (file: File) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (e.target?.result) {
        try {
          // Decode the audio file
          const arrayBuffer = e.target.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Get audio data from the left channel
          const rawData = audioBuffer.getChannelData(0);
          
          // Reduce data points for visualization (200 bars)
          const samples = 200;
          const blockSize = Math.floor(rawData.length / samples);
          const filteredData = [];
          
          for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i;
            let sum = 0;
            
            // Find the maximum absolute value in this block
            for (let j = 0; j < blockSize; j++) {
              sum = Math.max(sum, Math.abs(rawData[blockStart + j]));
            }
            
            filteredData.push(sum);
          }
          
          setWaveformData(filteredData);
        } catch (error) {
          console.error("Error decoding audio data:", error);
        }
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // We'll make sure we're getting enough timeupdate events by forcing updates
  useEffect(() => {
    // Update time display
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        // Force a re-render by setting the current time
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    if (audioRef.current) {
      // Make sure we get frequent updates
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0 || duration === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate visible duration within trim values
    const visibleDuration = trimValues[1] - trimValues[0];
    
    // Fixed number of bins to display (this will keep bin width consistent)
    const numberOfBins = 150; // More bins for better resolution
    
    // Calculate bin duration in seconds
    const binDuration = visibleDuration / numberOfBins;
    
    // Calculate bin width in pixels
    const binWidth = canvasWidth / numberOfBins;
    
    // Draw waveform - only show the trimmed section
    for (let i = 0; i < numberOfBins; i++) {
      // Calculate the time at the start and end of this bin
      const binStartTime = trimValues[0] + (i * binDuration);
      const binEndTime = binStartTime + binDuration;
      
      // Find corresponding indices in waveformData
      const startIdx = Math.floor((binStartTime / duration) * waveformData.length);
      const endIdx = Math.ceil((binEndTime / duration) * waveformData.length);
      
      // Calculate the maximum amplitude for this bin by checking all samples in the range
      let maxAmplitude = 0;
      for (let j = startIdx; j < endIdx && j < waveformData.length; j++) {
        if (j >= 0 && j < waveformData.length) {
          maxAmplitude = Math.max(maxAmplitude, waveformData[j] || 0);
        }
      }
      
      // Add a minimum height for better visualization
      maxAmplitude = Math.max(maxAmplitude, 0.05);
      
      // Calculate bar height
      const barHeight = maxAmplitude * canvasHeight * 0.8; // 80% of canvas height
      
      // Determine if this bin is in the played portion relative to the trim
      const isPlayed = binStartTime <= currentTime;
      
      // Set color based on played status
      if (isPlayed) {
        ctx.fillStyle = '#000000'; // Black for played portion
      } else {
        ctx.fillStyle = '#cccccc'; // Light gray for unplayed portion
      }
      
      // Draw the bar
      const x = i * binWidth;
      ctx.fillRect(x, (canvasHeight - barHeight) / 2, binWidth - 1, barHeight);
    }
    
    // Draw current position marker - this is the blue vertical line that shows playback position
    if (currentTime >= trimValues[0] && currentTime <= trimValues[1]) {
      // Calculate position percentage within the visible (trimmed) range
      const positionPercent = (currentTime - trimValues[0]) / (trimValues[1] - trimValues[0]);
      const markerX = positionPercent * canvasWidth;
      
      ctx.fillStyle = "#4F46E5"; // Blue marker (matching the slider color)
      ctx.fillRect(markerX - 1, 0, 2, canvasHeight);
      
      // Removed the circle at the marker position
    }
    
    // Draw time markers at the bottom
    const timeMarkers = 5;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.font = "10px Arial";
    
    for (let i = 0; i <= timeMarkers; i++) {
      const position = (i / timeMarkers) * canvasWidth;
      const time = trimValues[0] + (i / timeMarkers) * (trimValues[1] - trimValues[0]);
      
      // Draw time marker
      ctx.fillText(formatTime(time), position, canvasHeight - 5);
    }
  };

  // Force a check on trim boundaries whenever currentTime changes
  useEffect(() => {
    // If we're playing and outside trim boundaries, enforce them
    if (isPlaying && audioRef.current) {
      // If before start point, jump to start
      if (currentTime < trimValues[0]) {
        audioRef.current.currentTime = trimValues[0];
      }
      
      // If after end point, pause playback
      if (currentTime > trimValues[1]) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [currentTime, trimValues, isPlaying]);

  // Helper function to force a refresh of the waveform and playback indicator
  // This can help ensure the visualization stays in sync with audio playback
  const refreshWaveform = () => {
    if (audioRef.current) {
      // Get the current time directly from the audio element
      const currentAudioTime = audioRef.current.currentTime;
      // Update state to force redraw
      setCurrentTime(currentAudioTime);
    }
  };

  // Set up a timer to periodically refresh the waveform during playback
  useEffect(() => {
    let refreshTimer: number | null = null;
    
    if (isPlaying) {
      // Refresh every 100ms for smooth animation
      refreshTimer = window.setInterval(refreshWaveform, 100);
    }
    
    return () => {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer);
      }
    };
  }, [isPlaying]);

  // Handle space bar for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        togglePlayPause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, trimValues]);

  // Handle global mouse up events (for ending drag outside canvas)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      setDuration(audioDuration);
      setTrimValues([0, audioDuration]);
    }
  };

  const handleTrimChange = (values: number | number[]) => {
    if (Array.isArray(values) && values.length === 2) {
      setTrimValues([values[0], values[1]]);
      
      // If current position is outside new trim range, reset it
      if (audioRef.current && (audioRef.current.currentTime < values[0] || audioRef.current.currentTime > values[1])) {
        audioRef.current.currentTime = values[0];
        setCurrentTime(values[0]);
      }
    }
  };

  // We'll maintain audio element events separately
  useEffect(() => {
    const handlePause = () => {
      setIsPlaying(false);
      console.log("Audio paused");
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      console.log("Audio playing");
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      console.log("Audio ended");
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  const handleManualTrimChange = (type: 'start' | 'end', timeString: string) => {
    // Convert MM:SS format to seconds
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      const newTime = minutes * 60 + seconds;
      
      if (type === 'start') {
        // Validate range - start time must be less than end time and within duration
        if (newTime >= 0 && newTime < trimValues[1] && newTime < duration) {
          setTrimValues([newTime, trimValues[1]]);
          if (audioRef.current && audioRef.current.currentTime < newTime) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
          }
        }
      } else {
        // Validate range - end time must be greater than start time and within duration
        if (newTime > trimValues[0] && newTime <= duration) {
          setTrimValues([trimValues[0], newTime]);
        }
      }
    }
  };

  const setupTrimEndListener = () => {
    if (audioRef.current) {
      // Remove any existing listener
      if (timeUpdateListenerRef.current) {
        audioRef.current.removeEventListener('timeupdate', timeUpdateListenerRef.current);
        timeUpdateListenerRef.current = null;
      }
      
      // Create new listener
      const handleTimeUpdate = () => {
        if (audioRef.current && audioRef.current.currentTime >= trimValues[1]) {
          audioRef.current.pause();
          // Don't reset to start of trim - just pause at the end point
          setIsPlaying(false);
          
          // Remove listener after pausing
          if (timeUpdateListenerRef.current) {
            audioRef.current.removeEventListener('timeupdate', timeUpdateListenerRef.current);
            timeUpdateListenerRef.current = null;
          }
        }
      };
      
      // Store and add the new listener
      timeUpdateListenerRef.current = handleTimeUpdate;
      audioRef.current.addEventListener('timeupdate', timeUpdateListenerRef.current);
    }
  };

  // Separate useEffect for drawing the waveform when currentTime, waveformData, or trimValues change
  useEffect(() => {
    if (waveformData.length > 0 && duration > 0) {
      drawWaveform();
    }
  }, [currentTime, waveformData, trimValues, duration]);

  // Handle canvas clicks for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // Don't handle clicks during drag
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / rect.width;
    
    // Convert to time within the trimmed range
    const newTime = trimValues[0] + (clickPosition * (trimValues[1] - trimValues[0]));
    
    // Set the new time
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Mouse down handler to start scrubbing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updateTimeFromMousePosition(e);
  };

  // Mouse move handler for scrubbing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    updateTimeFromMousePosition(e);
  };

  // Mouse up handler to end scrubbing
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse leave handler
  const handleMouseLeave = () => {
    // Optional: you can also end dragging when mouse leaves the canvas
    // setIsDragging(false);
  };

  // Shared function to update time from mouse position
  const updateTimeFromMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const scrubPosition = x / rect.width;
    
    // Convert to time within the trimmed range
    const newTime = trimValues[0] + (scrubPosition * (trimValues[1] - trimValues[0]));
    
    // Set the new time
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Modified to work with the relative (trimmed) position
  const seekTo = (relativePosition: number | number[]) => {
    if (audioRef.current && typeof relativePosition === 'number') {
      // Convert relative position to absolute position
      const absolutePosition = trimValues[0] + relativePosition;
      audioRef.current.currentTime = absolutePosition;
      setCurrentTime(absolutePosition); // Update state immediately
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false); // Force state update
      } else {
        // If current position is outside trim range, reset to start
        if (audioRef.current.currentTime < trimValues[0] || audioRef.current.currentTime > trimValues[1]) {
          audioRef.current.currentTime = trimValues[0];
        }
        
        setupTrimEndListener();
        
        // Try to play and handle any errors
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(err => {
              console.error("Error playing audio:", err);
              setIsPlaying(false);
            });
        } else {
          // For older browsers that don't return a promise
          setIsPlaying(true);
        }
      }
    }
  };
// SVG for Play icon
const PlayIcon = () => (
    <svg width="40" height="40" viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
      <circle cx="170" cy="170" r="160" stroke="black" strokeWidth="10" fill="white"/>
      <path d="M130,100 L240,170 L130,240 Z" fill="black"/>
    </svg>
  );

  // SVG for Pause icon
  const PauseIcon = () => (
    <svg width="40" height="40" viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
      <circle cx="170" cy="170" r="160" stroke="black" strokeWidth="10" fill="white"/>
      <rect x="115" y="100" width="30" height="140" fill="black"/>
      <rect x="195" y="100" width="30" height="140" fill="black"/>
    </svg>
  );
  
  return (
    <div className="mt-6">
      {/* More prominent "Trim Audio" header */}
      <h2 className="text-3xl font-bold text-center mb-2">Trim Audio</h2>
      
      {/* Display audio file name and total duration */}
      <div className="text-center text-gray-600 mb-6">
        <p>File: <span className="font-medium">{audioFile.name}</span></p>
        <p className="mt-1">Total Duration: <span className="font-medium">{formatTime(duration)}</span></p>
      </div>
      
      {/* Hidden audio element - only render when audioUrl exists */}
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleMetadataLoaded}
          className="hidden"
        />
      ) : null}
      
      {/* Main container - removed relative positioning since we don't need volume control */}
      <div>
        {/* Main content centered, removed right padding since there's no volume control */}
        <div className="max-w-2xl mx-auto">
          {/* Waveform visualization */}
          <div className="relative mb-4 bg-gray-100 rounded">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={120} 
              className={`w-full h-32 rounded ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Current position and duration display - showing absolute time */}
          <div className="flex justify-between mb-3 text-sm font-medium">
            <span>Current: {formatTime(currentTime)}</span>
            <span>Trim Duration: {formatTime(getTrimmedDuration())}</span>
          </div>
          
          {/* Progress bar */}
          <div className="mb-6">
            <Slider
              min={0}
              max={getTrimmedDuration()}
              value={getRelativePosition()}
              onChange={seekTo}
              trackStyle={{ backgroundColor: '#4F46E5', height: 6 }}
              railStyle={{ backgroundColor: '#E5E7EB', height: 6 }}
              handleStyle={{
                borderColor: '#4F46E5',
                height: 16,
                width: 16,
                backgroundColor: 'white',
              }}
            />
          </div>
          
          {/* Play controls section - centered */}
          <div className="mb-8">
            {/* Icon-based play/pause button */}
            <div className="flex justify-center mb-4">
              <button
                ref={buttonRef}
                onClick={togglePlayPause}
                className="bg-transparent border-none cursor-pointer focus:outline-none"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>
            
            {/* Playback rate */}
            <div className="flex justify-center space-x-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`px-3 py-1 rounded text-sm ${
                    playbackRate === rate 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
          
          {/* Trim Range Section with manual time inputs */}
          {duration > 0 && (
            <div className="mb-8 border-t border-b py-6">
              <h4 className="font-medium mb-4 text-center text-lg">Trim Range</h4>
              
              {/* Manual time input fields */}
              <div className="flex justify-between items-center mt-3 mb-4">
                <div className="flex flex-col">
                  <label htmlFor="start-time" className="text-sm font-medium mb-1">Start Time</label>
                  <input 
                    id="start-time" 
                    type="text" 
                    value={formatTime(trimValues[0])} 
                    onChange={(e) => handleManualTrimChange('start', e.target.value)}
                    className="border rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0:00"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium mb-1">Duration</span>
                  <span className="font-bold text-indigo-600">{formatTime(trimValues[1] - trimValues[0])}</span>
                </div>
                
                <div className="flex flex-col">
                  <label htmlFor="end-time" className="text-sm font-medium mb-1">End Time</label>
                  <input 
                    id="end-time" 
                    type="text" 
                    value={formatTime(trimValues[1])} 
                    onChange={(e) => handleManualTrimChange('end', e.target.value)}
                    className="border rounded px-2 py-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0:00"
                  />
                </div>
              </div>
              
              {/* Slider for visually adjusting trim range */}
              <Slider
                range
                min={0}
                max={duration}
                value={trimValues}
                onChange={handleTrimChange}
                step={0.1}
                trackStyle={{ backgroundColor: '#10B981', height: 8 }}
                railStyle={{ backgroundColor: '#E5E7EB', height: 8 }}
                handleStyle={[
                  {
                    borderColor: '#10B981',
                    height: 20,
                    width: 20,
                    backgroundColor: 'white',
                  },
                  {
                    borderColor: '#10B981',
                    height: 20,
                    width: 20,
                    backgroundColor: 'white',
                  }
                ]}
              />
            </div>
          )}
          
          {/* Convert to Guitar Tabs button - centered at the bottom */}
          <div className="mt-8 mb-4 flex justify-center">
            <Button
              onClick={handleConvert}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg"
            >
              Convert to Guitar Tabs
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Supported formats: MP3, WAV, M4A, OGG (Max 20MB)
      </div>
    </div>
  );