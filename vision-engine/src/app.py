"""
Meowdel Real-Time Vision Processing Engine
Flask + SocketIO + OpenCV + ML

Continuous video stream processing with:
- Facial expression analysis
- Object detection
- OCR/document reading
- Accessibility features for blind users
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from dotenv import load_dotenv
import logging

# Import our processors
from processors.facial_analyzer import FacialAnalyzer
from processors.object_detector import ObjectDetector
from processors.ocr_reader import OCRReader
from processors.cat_commentator import CatCommentator

load_dotenv()

# Initialize Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'meowdel-secret-key')
CORS(app)

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    ping_timeout=60,
    ping_interval=25
)

# Initialize processors
facial_analyzer = FacialAnalyzer()
object_detector = ObjectDetector()
ocr_reader = OCRReader()
cat_commentator = CatCommentator()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'processors': {
            'facial': facial_analyzer.is_ready(),
            'object_detection': object_detector.is_ready(),
            'ocr': ocr_reader.is_ready(),
        }
    })


@socketio.on('connect')
def handle_connect():
    """Client connected to WebSocket"""
    logger.info(f'Client connected: {request.sid}')
    emit('connected', {
        'message': '*perks up* A human connected! *meow*',
        'sid': request.sid
    })


@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected"""
    logger.info(f'Client disconnected: {request.sid}')


@socketio.on('video_frame')
def handle_video_frame(data):
    """
    Process incoming video frame

    Data format:
    {
        'frame': 'base64_encoded_image',
        'userId': 'user123',
        'mode': 'full' | 'facial' | 'ocr' | 'objects',
        'speak': true/false  # Read aloud for blind users
    }
    """
    try:
        # Validate frame data exists
        frame_data_raw = data.get('frame')
        if not frame_data_raw or not isinstance(frame_data_raw, str):
            emit('error', {'message': 'Invalid or missing frame data'})
            return
            
        # Check size limits (e.g., max 5MB base64 string)
        if len(frame_data_raw) > 5 * 1024 * 1024:
            emit('error', {'message': 'Frame data exceeds 5MB size limit'})
            return

        if ',' not in frame_data_raw:
            emit('error', {'message': 'Invalid frame format'})
            return
            
        # Decode frame
        frame_data = frame_data_raw.split(',')[1]  # Remove data:image prefix
        try:
            frame_bytes = base64.b64decode(frame_data)
        except Exception:
            emit('error', {'message': 'Invalid base64 encoding'})
            return
            
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            emit('error', {'message': 'Failed to decode image data'})
            return

        mode = data.get('mode', 'full')
        user_id = data.get('userId')
        speak = data.get('speak', False)  # For accessibility

        result = {
            'timestamp': cv2.getTickCount(),
            'userId': user_id,
        }

        # Process based on mode
        if mode in ['full', 'facial']:
            facial_data = facial_analyzer.analyze(frame)
            result['facial'] = facial_data

        if mode in ['full', 'objects']:
            objects = object_detector.detect(frame)
            result['objects'] = objects

        if mode == 'ocr':
            text = ocr_reader.read(frame)
            result['text'] = text

            # Read aloud for blind users
            if speak and text:
                result['speech'] = ocr_reader.text_to_speech(text)

        # Get cat's commentary
        cat_response = cat_commentator.comment(result)
        result['catResponse'] = cat_response

        # Emit back to client
        emit('analysis_result', result)

    except Exception as e:
        logger.error(f'Error processing frame: {e}')
        emit('error', {'message': str(e)})


@socketio.on('read_document')
def handle_read_document(data):
    """
    Read a document aloud for blind users

    Data format:
    {
        'image': 'base64_image',
        'language': 'en',
        'voice': 'natural'  # or 'cat' for cat voice!
    }
    """
    try:
        # Validate image data exists
        image_data_raw = data.get('image')
        if not image_data_raw or not isinstance(image_data_raw, str):
            emit('error', {'message': 'Invalid or missing image data'})
            return
            
        # Check size limits
        if len(image_data_raw) > 5 * 1024 * 1024:
            emit('error', {'message': 'Image data exceeds 5MB size limit'})
            return

        if ',' not in image_data_raw:
            emit('error', {'message': 'Invalid image format'})
            return
            
        # Decode image
        image_data = image_data_raw.split(',')[1]
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            emit('error', {'message': 'Invalid base64 encoding'})
            return
            
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            emit('error', {'message': 'Failed to decode image data'})
            return

        # Extract text
        language = data.get('language', 'en')
        text = ocr_reader.read(image, language=language)

        # Generate speech
        voice_mode = data.get('voice', 'natural')

        if voice_mode == 'cat':
            # Cat reads the document in cat-speak!
            cat_narration = cat_commentator.narrate_document(text)
            result = {
                'text': text,
                'narration': cat_narration,
                'voice': 'cat'
            }
        else:
            # Natural voice
            speech_url = ocr_reader.text_to_speech(text)
            result = {
                'text': text,
                'audioUrl': speech_url,
                'voice': 'natural'
            }

        emit('document_read', result)

    except Exception as e:
        logger.error(f'Error reading document: {e}')
        emit('error', {'message': str(e)})


@socketio.on('analyze_expression')
def handle_analyze_expression(data):
    """
    Detailed facial expression analysis
    Real-time emotion detection for accessibility
    """
    try:
        # Validate frame data exists
        frame_data_raw = data.get('frame')
        if not frame_data_raw or not isinstance(frame_data_raw, str):
            emit('error', {'message': 'Invalid or missing frame data'})
            return
            
        # Check size limits
        if len(frame_data_raw) > 5 * 1024 * 1024:
            emit('error', {'message': 'Frame data exceeds 5MB size limit'})
            return

        if ',' not in frame_data_raw:
            emit('error', {'message': 'Invalid frame format'})
            return
            
        # Decode frame
        frame_data = frame_data_raw.split(',')[1]
        try:
            frame_bytes = base64.b64decode(frame_data)
        except Exception:
            emit('error', {'message': 'Invalid base64 encoding'})
            return
            
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            emit('error', {'message': 'Failed to decode image data'})
            return

        # Deep analysis
        analysis = facial_analyzer.deep_analyze(frame)

        # Cat's empathetic response
        cat_support = cat_commentator.emotional_support(analysis)

        result = {
            'expression': analysis,
            'catResponse': cat_support,
            'timestamp': cv2.getTickCount()
        }

        emit('expression_analysis', result)

    except Exception as e:
        logger.error(f'Error analyzing expression: {e}')
        emit('error', {'message': str(e)})


if __name__ == '__main__':
    logger.info('🐱 Meowdel Vision Engine starting...')
    logger.info('Initializing ML models...')

    # Warm up models
    facial_analyzer.warmup()
    object_detector.warmup()
    ocr_reader.warmup()

    logger.info('✅ All systems ready! *purr*')

    # Run server
    socketio.run(
        app,
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False') == 'True'
    )
