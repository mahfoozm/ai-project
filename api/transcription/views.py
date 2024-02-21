from django.shortcuts import render
from rest_framework import viewsets
from .models import File
from .serializers import FileSerializer
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from openai import OpenAI
from langchain import hub
from langchain.schema.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.chains.summarize import load_summarize_chain
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


class FileView(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    

@csrf_exempt
@require_POST
def summarize(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text', '')

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = [Document(page_content=x) for x in text_splitter.split_text(text)]

        llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo-1106")
        chain = load_summarize_chain(llm, chain_type="stuff")
        summary = chain.run(docs)

        return JsonResponse({'summary': summary})
    
    except:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)


@csrf_exempt
@require_POST
def answer_question(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text', '')
        question = data.get('question', '')

        # Load, chunk and index the contents of the text.
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = [Document(page_content=x) for x in text_splitter.split_text(text)]
        splits = text_splitter.split_documents(docs)


        vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())

        # Retrieve and generate using the relevant snippets of the text.
        retriever = vectorstore.as_retriever()
        prompt = hub.pull("rlm/rag-prompt")
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

        answer = rag_chain.invoke(question)

        # Cleanup
        vectorstore.delete_collection()

        return JsonResponse({'answer': answer})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)


@csrf_exempt
@require_POST
def action_items(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text', '')
        client = OpenAI()

        response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Pull out key action points from the transcript provided."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        temperature=0.7,
        max_tokens=64,
        top_p=1
        )

        return JsonResponse({'answer': response.choices[0].message.content})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    