"""
Facial Expression Analyzer
OpenCV + Face Recognition + DeepFace
Real-time emotion detection and facial analysis
"""

import cv2
import numpy as np
from deepface import DeepFace
import face_recognition
import logging

logger = logging.getLogger(__name__)


class FacialAnalyzer:
    def __init__(self):
        self.ready = False
        self.face_cascade = None
        self.emotion_model = None

    def is_ready(self):
        return self.ready

    def warmup(self):
        """Initialize models"""
        try:
            # Load Haar Cascade for face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)

            # Warm up DeepFace
            logger.info("Warming up facial analysis models...")
            test_img = np.zeros((100, 100, 3), dtype=np.uint8)
            try:
                DeepFace.analyze(test_img, actions=['emotion'], enforce_detection=False)
            except:
                pass  # Expected to fail, just warming up

            self.ready = True
            logger.info("✅ Facial analyzer ready")

        except Exception as e:
            logger.error(f"Failed to initialize facial analyzer: {e}")

    def analyze(self, frame):
        """
        Quick facial analysis for real-time streaming

        Returns:
        {
            'faces_detected': int,
            'primary_emotion': str,
            'emotions': {...},
            'looking_at_camera': bool,
            'facial_features': {...}
        }
        """
        try:
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Detect faces
            faces = face_recognition.face_locations(rgb_frame)

            if len(faces) == 0:
                return {
                    'faces_detected': 0,
                    'message': '*looks around* Where did you go, hooman?'
                }

            # Get primary face (largest)
            face = max(faces, key=lambda f: (f[2] - f[0]) * (f[3] - f[1]))
            top, right, bottom, left = face

            # Extract face region
            face_img = rgb_frame[top:bottom, left:right]

            # Quick emotion detection
            try:
                analysis = DeepFace.analyze(
                    face_img,
                    actions=['emotion', 'age', 'gender'],
                    enforce_detection=False,
                    silent=True
                )

                emotions = analysis[0]['emotion']
                primary_emotion = max(emotions, key=emotions.get)

                return {
                    'faces_detected': len(faces),
                    'primary_emotion': primary_emotion,
                    'emotions': emotions,
                    'age': analysis[0].get('age'),
                    'gender': analysis[0].get('dominant_gender'),
                    'looking_at_camera': self._check_eye_contact(face_img),
                    'face_position': {
                        'top': top,
                        'right': right,
                        'bottom': bottom,
                        'left': left
                    }
                }

            except Exception as e:
                logger.warning(f"Emotion detection failed: {e}")
                return {
                    'faces_detected': len(faces),
                    'primary_emotion': 'neutral',
                    'error': str(e)
                }

        except Exception as e:
            logger.error(f"Facial analysis error: {e}")
            return {'error': str(e)}

    def deep_analyze(self, frame):
        """
        Detailed facial analysis for accessibility features

        Returns detailed information about:
        - Facial expressions
        - Eye contact
        - Head pose
        - Micro-expressions
        - Engagement level
        """
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Full DeepFace analysis
            analysis = DeepFace.analyze(
                rgb_frame,
                actions=['emotion', 'age', 'gender', 'race'],
                enforce_detection=False,
                silent=True
            )

            if not analysis:
                return {'error': 'No face detected'}

            result = analysis[0]

            # Enhanced features
            return {
                'emotion': result['emotion'],
                'dominant_emotion': result['dominant_emotion'],
                'age': result['age'],
                'gender': result['dominant_gender'],
                'race': result['dominant_race'],
                'engagement_score': self._calculate_engagement(result),
                'accessibility_description': self._describe_expression(result)
            }

        except Exception as e:
            logger.error(f"Deep analysis error: {e}")
            return {'error': str(e)}

    def _check_eye_contact(self, face_img):
        """
        Check if person is looking at camera
        Simplified - just checks if eyes are visible
        """
        try:
            gray = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
            eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            eyes = eye_cascade.detectMultiScale(gray, 1.3, 5)
            return len(eyes) >= 2
        except:
            return False

    def _calculate_engagement(self, analysis):
        """
        Calculate how engaged the person is (0-100)
        Based on emotions and facial features
        """
        emotions = analysis['emotion']

        # Engaged emotions
        engagement_emotions = ['happy', 'surprise', 'neutral']
        disengaged_emotions = ['sad', 'fear', 'disgust', 'angry']

        engaged_score = sum(emotions.get(e, 0) for e in engagement_emotions)
        disengaged_score = sum(emotions.get(e, 0) for e in disengaged_emotions)

        # Calculate engagement (0-100)
        total = engaged_score + disengaged_score
        if total == 0:
            return 50

        engagement = (engaged_score / total) * 100
        return round(engagement, 2)

    def _describe_expression(self, analysis):
        """
        Generate accessibility-friendly description