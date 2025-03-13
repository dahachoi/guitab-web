// app/api/upload-audio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-m4a', 'audio/ogg'];
    if (!validAudioTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP3, WAV, M4A, or OGG files' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const originalFilename = audioFile.name;
    const fileExtension = originalFilename.split('.').pop();
    const newFilename = `${timestamp}-${originalFilename}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }
    
    // Convert file to buffer and save it
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save the file
    const filepath = join(uploadDir, newFilename);
    await writeFile(filepath, buffer);
    
    // TODO: Queue the file for processing by the FastAPI backend
    // This would normally be handled by a message queue or direct API call
    
    return NextResponse.json({ 
      success: true,
      filename: newFilename,
      fileSize: audioFile.size,
      message: 'File uploaded successfully. It will be processed for tab generation.',
      // In a real implementation, you might return a job ID that the frontend 
      // can use to check processing status
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the file' },
      { status: 500 }
    );
  }
}

// Configure for larger file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};