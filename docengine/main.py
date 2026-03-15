from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

# Import unstructured partition functions
from unstructured.partition.auto import partition
from unstructured.chunking.title import chunk_by_title

app = FastAPI(title="Meowdel DocEngine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    ext = os.path.splitext(file.filename)[1].lower()
    
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            # Use unstructured's auto partitioner to handle PDF, DOCX, XLSX, HTML, Images etc
            elements = partition(filename=temp_path)
            
            # Optional: Chunk by title to make markdown output cleaner
            chunks = chunk_by_title(elements)
            
            # Reconstruct into Markdown representation
            markdown_content = "\n\n".join([str(chunk) for chunk in chunks])

            if not markdown_content.strip():
                markdown_content = "Document parsed but yielded no text content."

            return {
                "filename": file.filename,
                "markdown": markdown_content
            }

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "docengine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
