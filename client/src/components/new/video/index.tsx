import { useState, useEffect } from 'react';
import axios from 'axios';
import { ROOT_URL } from '@/constants/urls';
import { useCopy } from '@/hooks/use-copy';
import { UploadedFile } from '@/state/reducers/app-reducer';
import Indicators from './indicators';

type Props = {
  file: UploadedFile;
  transformLoading?: boolean;
};

export default function Video({ file, transformLoading }: Props) {
  const [questionInput, setQuestionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string | null>(null);
  const copyToClipboard = useCopy();

  useEffect(() => {
    if (file.transcript) {
      fetchSummary();
      fetchActionItems();
    }
  }, [file.transcript]);

  const isVideo = file?.file.endsWith('.mp4');
  const src = file?.file.startsWith('/') ? ROOT_URL + file.file : file?.file;

  const downloadTranscript = () => {
    const transcriptText = `Transcript:\n${file.transcript}\n\n`;
    const summaryText = summary ? `Summary:\n${summary}\n\n` : '';
    const actionItemsText = actionItems ? `Action Items:\n${actionItems}\n\n` : '';

    const combinedText = transcriptText + summaryText + actionItemsText;

    const blob = new Blob([combinedText], { type: 'text/plain' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'transcript.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const askQuestion = async () => {
    if (!file.transcript) {
      alert('Please generate a transcript first.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('http://127.0.0.1:8000/answer/', {
        text: file.transcript,
        question: questionInput,
      });

      setAnswer(response.data.answer);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/summarize/', {
        text: file.transcript,
      });

      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchActionItems = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/action_items/', {
        text: file.transcript,
      });

      console.log(response.data.actionItems);
      setActionItems(response.data.answer);
    } catch (error) {
      console.error('Error fetching action items:', error);
    }
  };

  return (
    <div className="w-full bg-[#101214] text-white py-4 px-4 rounded-md mt-5">
      {isVideo ? (
        <video src={src} width="100%" style={{ maxHeight: '500px' }} controls />
      ) : (
        <audio src={src} controls muted />
      )}
      <Indicators title={file.title} transformLoading={transformLoading} />
      <div className="text-base font-medium border-[1px] border-[#212528] p-2 my-2">
        <div className="mb-2 text-sm">Transcript</div>
        <p className="text-sm">{file.transcript}</p>
      </div>
      {summary !== null && (
        <div className="text-base font-medium border-[1px] border-[#212528] p-2 my-2">
          <div className="mb-2 text-sm">Summary</div>
          <p className="text-sm">{summary}</p>
        </div>
      )}
      {actionItems !== null && (
        <div className="text-base font-medium border-[1px] border-[#212528] p-2 my-2">
          <div className="mb-2 text-sm">Action Items</div>
          <p className="text-sm" dangerouslySetInnerHTML={{ __html: actionItems.replace(/\n/g, '<br>') }} />
        </div>
      )}
      <div className="my-4">
        <h2 className="text-lg font-semibold mb-2">Ask questions</h2>
        <div className="flex">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Type your question here"
            className="flex-grow py-1 px-2 border-[1px] border-[#212528] rounded mr-2"
          />
          <button
            onClick={askQuestion}
            className="bg-slate-800 hover:bg-slate-700 text-sm text-white py-1 px-2 rounded transition duration-500 ease-in-out"
          >
            Ask
          </button>
        </div>
      </div>
      {loading && <div className="spinner"></div>}
      {answer !== null && (
        <div className="text-base font-medium border-[1px] border-[#212528] p-2 my-2">
          <div className="mb-2 text-sm">Answer</div>
          <p className="text-sm">{answer}</p>
        </div>
      )}
      <button
        onClick={downloadTranscript}
        className="bg-slate-800 hover:bg-slate-700 text-sm text-white py-1 px-2 rounded transition duration-500 ease-in-out ml-2"
      >
        Download
      </button>
    </div>
  );
}
