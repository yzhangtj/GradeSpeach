from flask import Flask, request, jsonify
from openai import OpenAI
import os
from flask_cors import CORS
import io
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("The OPENAI_API_KEY environment variable is not set.")

app = Flask(__name__)
CORS(app)  # Enable CORS

client = OpenAI(api_key=api_key)

@app.route('/transcribe-audio', methods=['POST'])
def transcribe_audio():
    if 'audioFile' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audioFile']
    audio_file_bytes = io.BytesIO()
    audio_file.save(audio_file_bytes)
    audio_file_bytes.seek(0)
    print("Audio file size:", len(audio_file_bytes.getvalue()))  # Debugging line
    print("Content Type:", audio_file.content_type)

    try:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio_file.filename, audio_file_bytes, audio_file.content_type),
            response_format="text"
        )
        print(type(response))
        print(response)

        # Since the response is a string, use it directly
        transcription_text = response if response else "Could not transcribe audio."
        
        print("OpenAI API Response:", transcription_text)

        return jsonify({'transcription': transcription_text})
    except Exception as e:
        # If an exception is caught, log it and return it
        print("Exception:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
