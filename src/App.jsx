import { useState } from 'react';
import { Camera, Link2, Download, Search, PlayCircle } from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('reels');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = async () => {
    if (!inputValue) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const endpoint = activeTab === 'reels' ? '/api/download/reel' : '/api/download/story';
      const payload = activeTab === 'reels' ? { url: inputValue } : { username: inputValue };

      // Use environment variable for production, fallback to localhost for development
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Failed to connect to backend", error);
      alert("Failed to connect to the backend server. Is it running on port 5000?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Animated Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="container">
        <header className="header">
          <div className="logo">
            <Camera className="logo-icon" size={32} />
            InstaSave
          </div>
          <button className="btn-icon">
            <PlayCircle size={24} />
          </button>
        </header>

        <main className="main-content">
          <h1 className="hero-title">
            Download High Quality<br />
            <span>Stories & Reels</span>
          </h1>
          <p className="hero-subtitle">
            Save any public Instagram Reel or Story in maximum resolution with the original audio track intact.
          </p>

          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'reels' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reels'); setResult(null); setInputValue(''); }}
            >
              Public Reels
            </div>
            <div 
              className={`tab ${activeTab === 'story' ? 'active' : ''}`}
              onClick={() => { setActiveTab('story'); setResult(null); setInputValue(''); }}
            >
              Public Stories
            </div>
          </div>

          <div className="glass-panel downloader-card">
            <div className="input-group">
              {activeTab === 'reels' ? (
                <Link2 className="input-icon" size={20} />
              ) : (
                <Search className="input-icon" size={20} />
              )}
              <input 
                type="text" 
                className="glass-input" 
                placeholder={activeTab === 'reels' ? "Paste Instagram Reel link here..." : "Enter public Instagram username (e.g. @therock)"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%' }}
              onClick={handleDownload}
              disabled={isLoading || !inputValue}
            >
              {isLoading ? (
                <>
                  <div className="loader"></div> Processing...
                </>
              ) : (
                <>
                  <Download size={20} /> Download {activeTab === 'reels' ? 'Reel' : 'Stories'}
                </>
              )}
            </button>

            {/* Mock Result Area */}
            {result && (
              <div className="result-area">
                <h3 style={{ textAlign: 'left', fontSize: '1.2rem', fontWeight: 600 }}>
                  Ready to Download
                </h3>
                <video 
                  className="video-preview" 
                  src={result.url} 
                  controls 
                  poster={result.thumbnail}
                ></video>
                <button className="btn-primary" style={{ background: 'var(--secondary)', color: '#000' }}>
                  <Download size={20} /> Save to Device
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
