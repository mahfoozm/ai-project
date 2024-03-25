import os
import math
import subprocess
from django.core.files.storage import default_storage
from pydub import AudioSegment
from asgiref.sync import sync_to_async
from openai import OpenAI

from .serializers import FileSerializer
from .models import File

client = OpenAI()

max_bytes = 26214400
overlap_seconds = 5

class Transcribe:

    @staticmethod
    def get_audio_file(file):
        path = default_storage.path(file.file.name)
        if file.file.name.endswith('.mp4'):
            audio = AudioSegment.from_file(path, format='mp4')
            dir_path = os.path.dirname(path)
            new_file_name = file.file.name.replace('.mp4', '.mp3')
            new_file_path = os.path.join(dir_path, new_file_name)
            audio.export(new_file_path, format='mp3')
            return new_file_path
        return path

    @sync_to_async
    def transcribe_file(self, file_id):
        file = File.objects.filter(id=file_id).first()
        if not file:
            return None
        filename = self.get_audio_file(file)

        # Get the bit rate directly from the file
        bit_rate = float(subprocess.check_output(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=bit_rate", "-of",
             "default=noprint_wrappers=1:nokey=1", filename]).strip())

        # Estimate the duration of each chunk
        chunk_duration_s = (max_bytes * 8.0) / bit_rate * 0.9

        # Get the duration of the audio file
        audio_duration_s = float(subprocess.check_output(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of",
             "default=noprint_wrappers=1:nokey=1", filename]).strip())

        # Calculate the number of chunks
        num_chunks = math.ceil(audio_duration_s / (chunk_duration_s - overlap_seconds))

        transcriptions = []

        for i in range(num_chunks):
            start_s = i * (chunk_duration_s - overlap_seconds)
            end_s = start_s + chunk_duration_s

            # Save the chunk to disk
            chunk_file = f"chunk_{i + 1}.mp3"

            # Use ffmpeg to extract the chunk directly into the compressed format (m4a)
            subprocess.call(["ffmpeg", "-ss", str(start_s), "-i", filename, "-t",
                             str(chunk_duration_s), "-vn", "-acodec", "copy", "-y",
                             chunk_file])

            with open(chunk_file, "rb") as f:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    response_format="text"
                )
                transcriptions.append(transcription)

        file.transcript = transcriptions
        file.save()
        data = FileSerializer(file).data
        return data