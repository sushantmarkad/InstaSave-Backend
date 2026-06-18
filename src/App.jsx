import { useState } from 'react';
import { Camera, Link2, Download, Search } from 'lucide-react';
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
      let endpoint = '/api/download/reel';
      if (activeTab === 'story') endpoint = '/api/download/story';
      if (activeTab === 'posts') endpoint = '/api/download/post';
      
      const payload = { url: inputValue };

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
    <div className="app-wrapper">
      <div className="container">
        
        <header className="header">
          <div className="logo">
            <Camera className="logo-icon" size={28} />
            InstaSave
          </div>
        </header>

        <main className="main-content">
          <h1 className="hero-title">
            Download <span>High Quality</span><br />
            Stories, Posts & Reels
          </h1>
          <p className="hero-subtitle">
            Save any public Instagram media in maximum resolution with the original audio track intact. Fast, secure, and free.
          </p>

          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'reels' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reels'); setResult(null); setInputValue(''); }}
            >
              Reels
            </div>
            <div 
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('posts'); setResult(null); setInputValue(''); }}
            >
              Posts
            </div>
            <div 
              className={`tab ${activeTab === 'story' ? 'active' : ''}`}
              onClick={() => { setActiveTab('story'); setResult(null); setInputValue(''); }}
            >
              Stories
            </div>
          </div>

          <div className="downloader-card">
            <div className="input-group">
              {activeTab === 'story' ? (
                <Search className="input-icon" size={20} />
              ) : (
                <Link2 className="input-icon" size={20} />
              )}
              <input 
                type="text" 
                className="modern-input" 
                placeholder={
                  activeTab === 'reels' ? "Paste Instagram Reel link here..." : 
                  activeTab === 'posts' ? "Paste Instagram Post link here..." :
                  "Paste Instagram Story link here..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleDownload}
              disabled={isLoading || !inputValue}
            >
              {isLoading ? (
                <>
                  <div className="loader"></div> Processing...
                </>
              ) : (
                <>
                  <Download size={20} /> Download {activeTab === 'reels' ? 'Reel' : activeTab === 'posts' ? 'Post' : 'Story'}
                </>
              )}
            </button>

            {result && (
              <div className="result-area">
                <h3 className="result-title">Ready to Download</h3>
                
                {result.caption && (
                  <p className="video-caption">
                    {result.caption}
                  </p>
                )}
                
                <video 
                  className="video-preview" 
                  src={result.url} 
                  controls 
                  poster={result.thumbnail}
                ></video>
                
                <a 
                  href={result.url} 
                  download={result.caption ? `${result.caption.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.mp4` : 'Instagram_Video.mp4'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary btn-download" 
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={20} /> Save to Device
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <footer className="footer">
        <p className="copyright">Created by <span>Sushant Markad</span></p>
      </footer>
    </div>
  );
}

export default App;
