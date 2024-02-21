import React, { useRef, useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import Loading from '../loading';
import Form from './form';
import { AppContext } from '../../providers/new-provider';
import Video from './video';
import disclaimerImage from '../../assets/uoft.png';

function DisclaimerPopup({ onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-content">
          <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Disclaimer</h2>
          <p>
            This website uses OpenAI's services for processing the data you input. By using this site, you acknowledge and agree that the information you provide may be sent to OpenAI for analysis and processing. OpenAI will handle your data in accordance with its privacy policy.
          </p>
          <p style={{ marginTop: '10px' }}>
            Please ensure that you do not input any sensitive or personally identifiable information that you do not want to be processed by OpenAI.
          </p>
          <div style={{ marginTop: '20px' }}>
            <button onClick={onClose} className="acknowledge-button" style={{ pointerEvents: 'auto' }}>
              I Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function New() {
  const [{ uploadedFile, transformLoading, uploadLoading }, dispatch] = useContext(AppContext);
  const ws = useRef<WebSocket>();
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    
    if (showDisclaimer && mainContent) {
      document.body.style.overflow = 'hidden';
      mainContent.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = 'auto';
      if (mainContent) {
        mainContent.style.pointerEvents = 'auto';
      }
    }
  }, [showDisclaimer]);

  useEffect(() => {
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws/transcribe/');

    ws.current.onopen = () => {
      console.log('connected');
    };

    ws.current.onmessage = (evt: MessageEvent) => {
      const data = JSON.parse(evt.data);
      if (data.type === 'TRANSFORM') {
        dispatch({ type: 'TRANSFORM', payload: data?.value });
        dispatch({ type: 'TRANSFORM_LOADING', payload: false });
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [dispatch]);

  function extractTranscriptions() {
    if (!uploadedFile?.id) {
      return;
    }
    ws.current?.send(JSON.stringify({ file: uploadedFile?.id }));
    dispatch({ type: 'TRANSFORM_LOADING', payload: true });
  }

  function handleStartOver() {
    if (!transformLoading || !uploadLoading) {
      window.location.reload();
    }
  }

  function handleCloseDisclaimer() {
    setShowDisclaimer(false);
  }

  return (
    <div id="main-content" className="grid place-items-center">
      {showDisclaimer && <DisclaimerPopup onClose={handleCloseDisclaimer} />}
      <Image
        src={disclaimerImage}
        alt="UofT Logo"
        layout="fixed"
        width={200}
        height={200}
        style={{ position: 'absolute', top: 20, left: 100 }}
      />

      <h1 className="text-2xl my-10">Generate transcripts for lecture videos</h1>
      <Form />
      {uploadedFile ? <Video file={uploadedFile} transformLoading={transformLoading} /> : null}
      {uploadedFile ? (
        <button
          onClick={() => extractTranscriptions()}
          className={`mt-4 bg-teal-500 mx-auto flex items-center text-white py-1 px-4 rounded hover:bg-teal-700 transition duration-500 ease-in-out`}
        >
          {transformLoading ? <Loading /> : null}
          Transcribe
        </button>
      ) : null}
      {uploadedFile?.file ? (
        <button
          onClick={handleStartOver}
          className={`flex items-center mx-auto mt-4 bg-none text-white py-1 px-4 rounded transition duration-500 ease-in-out `}
        >
          Start Over
        </button>
      ) : null}
    </div>
  );
}
