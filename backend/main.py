# main.py - FastAPI backend
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import shutil
from datetime import datetime

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

class TabGenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str

# Simulate tab generation process
def process_audio_file(file_path: str, job_id: str):
    # This is where your AI processing would happen
    # For now, we'll just simulate processing with a delay
    import time
    time.sleep(10)  # Simulate processing time
    
    # Create a dummy tab file as output
    output_path = os.path.join("processed", f"{job_id}.txt")
    with open(output_path, "w") as f:
        f.write(f"""Guitar Tab Generated at {datetime.now()}
        
E|--0--2--3--2--0-----------------------|
B|------------------3--1--0-------------|
G|--------------------------------0--2--|
D|----------------------------------------|
A|----------------------------------------|
E|----------------------------------------|
""")
    
    # Update job status in a real application
    # This would typically be stored in a database

@app.post("/api/generate-tab", response_model=TabGenerationResponse)
async def generate_tab(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Validate file
    if not file.filename.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload MP3, WAV, OGG, or M4A files.")
    
    # Generate a unique job ID
    job_id = str(uuid.uuid4())
    
    # Save the uploaded file
    file_path = os.path.join("uploads", f"{job_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process the file in the background
    background_tasks.add_task(process_audio_file, file_path, job_id)
    
    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Your audio file is being processed. Check back in a few minutes."
    }

@app.get("/api/tab-status/{job_id}", response_model=TabGenerationResponse)
async def check_tab_status(job_id: str):
    # In a real application, you would check a database for the job status
    # For this example, we'll check if the output file exists
    output_path = os.path.join("processed", f"{job_id}.txt")
    
    if os.path.exists(output_path):
        return {
            "job_id": job_id,
            "status": "completed",
            "message": "Tab generation complete. You can now download your tab."
        }
    else:
        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Your tab is still being generated. Please check back later."
        }

@app.get("/api/download-tab/{job_id}")
async def download_tab(job_id: str):
    output_path = os.path.join("processed", f"{job_id}.txt")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Tab not found or still processing.")
    
    # In a real application, you would return the file for download
    with open(output_path, "r") as f:
        tab_content = f.read()
    
    return {"tab_content": tab_content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)