# # main.py - FastAPI backend
# from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import os
# import uuid
# import shutil
# from datetime import datetime

# app = FastAPI(title="Guitar Tab Generator API")

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Update with your frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Create directories if they don't exist
# os.makedirs("uploads", exist_ok=True)
# os.makedirs("processed", exist_ok=True)

# class TabGenerationResponse(BaseModel):
#     job_id: str
#     status: str
#     message: str

# # Simulate tab generation process
# def process_audio_file(file_path: str, job_id: str):
#     # This is where your AI processing would happen
#     # For now, we'll just simulate processing with a delay
#     import time
#     time.sleep(10)  # Simulate processing time
    
#     # Create a dummy tab file as output
#     output_path = os.path.join("processed", f"{job_id}.txt")
#     with open(output_path, "w") as f:
#         f.write(f"""Guitar Tab Generated at {datetime.now()}
        
# E|--0--2--3--2--0-----------------------|
# B|------------------3--1--0-------------|
# G|--------------------------------0--2--|
# D|----------------------------------------|
# A|----------------------------------------|
# E|----------------------------------------|
# """)
    
#     # Update job status in a real application
#     # This would typically be stored in a database

# @app.post("/api/generate-tab", response_model=TabGenerationResponse)
# async def generate_tab(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
#     # Validate file
#     if not file.filename.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
#         raise HTTPException(status_code=400, detail="Invalid file format. Please upload MP3, WAV, OGG, or M4A files.")
    
#     # Generate a unique job ID
#     job_id = str(uuid.uuid4())
    
#     # Save the uploaded file
#     file_path = os.path.join("uploads", f"{job_id}_{file.filename}")
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
    
#     # Process the file in the background
#     background_tasks.add_task(process_audio_file, file_path, job_id)
    
#     return {
#         "job_id": job_id,
#         "status": "processing",
#         "message": "Your audio file is being processed. Check back in a few minutes."
#     }

# @app.get("/api/tab-status/{job_id}", response_model=TabGenerationResponse)
# async def check_tab_status(job_id: str):
#     # In a real application, you would check a database for the job status
#     # For this example, we'll check if the output file exists
#     output_path = os.path.join("processed", f"{job_id}.txt")
    
#     if os.path.exists(output_path):
#         return {
#             "job_id": job_id,
#             "status": "completed",
#             "message": "Tab generation complete. You can now download your tab."
#         }
#     else:
#         return {
#             "job_id": job_id,
#             "status": "processing",
#             "message": "Your tab is still being generated. Please check back later."
#         }

# @app.get("/api/download-tab/{job_id}")
# async def download_tab(job_id: str):
#     output_path = os.path.join("processed", f"{job_id}.txt")
    
#     if not os.path.exists(output_path):
#         raise HTTPException(status_code=404, detail="Tab not found or still processing.")
    
#     # In a real application, you would return the file for download
#     with open(output_path, "r") as f:
#         tab_content = f.read()
    
#     return {"tab_content": tab_content}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import shutil
import tempfile
import subprocess
from datetime import datetime
import json
from typing import Optional

app = FastAPI(title="Guitar Tab Generator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("processed", exist_ok=True)
os.makedirs("tabs", exist_ok=True)

class TabGenerationRequest(BaseModel):
    filename: str
    start_time: float
    end_time: float

class TabGenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str

class TabStatusResponse(BaseModel):
    job_id: str
    status: str
    message: str
    tab_content: Optional[str] = None
    visualization_url: Optional[str] = None

# Store job status in memory (in production, use a database)
job_status = {}

def process_audio_file(job_id: str, file_path: str, start_time: float, end_time: float):
    """Process the audio file to generate guitar tabs using your Python script."""
    try:
        # Create a trimmed version of the audio if needed
        trim_path = os.path.join("uploads", f"{job_id}_trimmed.wav")
        
        # Use ffmpeg to trim the audio
        if start_time > 0 or end_time < float('inf'):
            duration = end_time - start_time
            subprocess.run([
                "ffmpeg", "-i", file_path, 
                "-ss", str(start_time), 
                "-t", str(duration),
                "-acodec", "pcm_s16le",  # Use WAV format for processing
                "-ar", "44100",  # Standard sample rate
                trim_path
            ], check=True)
        else:
            # If no trimming is needed, just convert to WAV for consistency
            subprocess.run([
                "ffmpeg", "-i", file_path, 
                "-acodec", "pcm_s16le", 
                "-ar", "44100",
                trim_path
            ], check=True)
        
        # Set paths for output files
        tab_output_path = os.path.join("tabs", f"{job_id}.txt")
        visualization_path = os.path.join("processed", f"{job_id}_notes.png")
        
        # Call your guitar tab generation script
        subprocess.run([
            "python", "backend/guitar_tab_generator.py",  # Path to your script
            "--input", trim_path,
            "--output", tab_output_path,
            "--visualization", visualization_path
        ], check=True)
        
        # Update job status to completed
        job_status[job_id] = {
            "status": "completed",
            "message": "Tab generation complete",
            "tab_path": tab_output_path,
            "visualization_path": visualization_path
        }
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        # Update job status to failed
        job_status[job_id] = {
            "status": "failed",
            "message": f"Error processing file: {str(e)}"
        }

@app.post("/api/upload", response_model=TabGenerationResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file for processing."""
    try:
        # Validate file
        if not file.filename.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file format. Please upload MP3, WAV, OGG, or M4A files."
            )
        
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Save the uploaded file
        file_extension = os.path.splitext(file.filename)[1]
        file_path = os.path.join("uploads", f"{job_id}{file_extension}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the job ID
        return {
            "job_id": job_id,
            "status": "uploaded",
            "message": "File uploaded successfully. Now you can trim and process it."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-tab", response_model=TabGenerationResponse)
async def generate_tab(
    background_tasks: BackgroundTasks, 
    request: TabGenerationRequest
):
    """Generate a guitar tab from a previously uploaded audio file."""
    try:
        # Get file path from filename
        file_path = None
        for extension in ['.mp3', '.wav', '.ogg', '.m4a']:
            potential_path = os.path.join("uploads", f"{request.filename}{extension}")
            if os.path.exists(potential_path):
                file_path = potential_path
                break
        
        if not file_path:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Set initial job status
        job_status[job_id] = {
            "status": "processing",
            "message": "Your audio file is being processed. Check back in a few minutes."
        }
        
        # Process the file in the background
        background_tasks.add_task(
            process_audio_file, 
            job_id, 
            file_path,
            request.start_time,
            request.end_time
        )
        
        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Your audio file is being processed. Check back in a few minutes."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tab-status/{job_id}", response_model=TabStatusResponse)
async def check_tab_status(job_id: str):
    """Check the status of a tab generation job."""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    status_info = job_status[job_id]
    
    response = {
        "job_id": job_id,
        "status": status_info["status"],
        "message": status_info["message"]
    }
    
    # If job is completed, add tab content and visualization URL
    if status_info["status"] == "completed":
        tab_path = status_info.get("tab_path")
        if tab_path and os.path.exists(tab_path):
            with open(tab_path, "r") as f:
                response["tab_content"] = f.read()
        
        visualization_path = status_info.get("visualization_path")
        if visualization_path and os.path.exists(visualization_path):
            # Create a relative URL for the frontend to access
            response["visualization_url"] = f"/api/visualization/{job_id}"
    
    return response

@app.get("/api/visualization/{job_id}")
async def get_visualization(job_id: str):
    """Get the visualization image for a completed job."""
    if job_id not in job_status or job_status[job_id]["status"] != "completed":
        raise HTTPException(status_code=404, detail="Visualization not found")
    
    visualization_path = job_status[job_id].get("visualization_path")
    if not visualization_path or not os.path.exists(visualization_path):
        raise HTTPException(status_code=404, detail="Visualization file not found")
    
    return FileResponse(visualization_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)