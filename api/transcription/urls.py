from django.urls import path, include
from rest_framework import routers

from transcription.views import FileView
from transcription.views import answer_question

router = routers.DefaultRouter()
router.register(r'files', FileView)

urlpatterns = [
    path('', include(router.urls)),
    path('answer/', answer_question, name='answer_question'), 
]
