import os
from django.core.files.storage import default_storage
from pydub import AudioSegment
from asgiref.sync import sync_to_async
from openai import OpenAI

from .serializers import FileSerializer
from .models import File

client = OpenAI()

class Transcribe:

    @staticmethod
    def get_audio_file(file):
        path = default_storage.path(file.file.name)
        if (file.file.name.endswith('.mp4')):
            audio = AudioSegment.from_file(path, format='mp4')
            dir_path = os.path.dirname(path)
            new_file_name = file.file.name.replace('.mp4', '.mp3')
            new_file_path = os.path.join(dir_path, new_file_name)
            audio.export(new_file_path, format='mp3')
        return path

    @sync_to_async
    def transcribe_file(self, file_id):
        file = File.objects.filter(id=file_id).first()
        if not file:
            return None
        audio_file_path = default_storage.path(file.file.name)
        audio_file = open(audio_file_path, 'rb')
        
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )

        file.transcript = transcription
        file.save()
        data = FileSerializer(file).data
        return data