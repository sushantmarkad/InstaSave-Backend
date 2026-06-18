require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: In production, you should set FRONTEND_URL in your Railway Environment Variables
// Example: FRONTEND_URL=https://my-instasave.vercel.app
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
// We are using a popular free Instagram Downloader API on RapidAPI.
// Make sure to subscribe to an API like "Instagram Downloader" on RapidAPI and get the host URL.
// Example API: https://rapidapi.com/backend-api/api/instagram-downloader-download-instagram-videos-stories
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'instagram-post-reels-stories-downloader-api.p.rapidapi.com';

const handleDownload = async (req, res, type) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!RAPIDAPI_KEY) {
      console.warn("No RAPIDAPI_KEY provided, returning mock data.");
      return res.json({
        type: type,
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop',
        username: 'mock_user'
      });
    }

    // Call the Managed Scraper API
    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}/instagram/`, // Universal endpoint for this specific API
      params: { url: url },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const videoData = response.data;

    if (videoData.status === false) {
      throw new Error(videoData.message || "Invalid URL or API rejected the request.");
    }
    
    let mediaData = videoData.result || videoData.media || videoData.data || videoData;
    let mediaUrl = '';
    
    if (Array.isArray(mediaData)) {
      mediaUrl = mediaData[0]?.video_url || mediaData[0]?.url || mediaData[0]?.media || mediaData[0];
    } else if (typeof mediaData === 'object' && mediaData !== null) {
      mediaUrl = mediaData.video_url || mediaData.url || mediaData.media;
    } else if (typeof mediaData === 'string') {
      mediaUrl = mediaData;
    }
    
    if (!mediaUrl || typeof mediaUrl !== 'string') {
      throw new Error("Could not extract a valid video URL from the API response.");
    }
    
    const caption = mediaData.caption || mediaData.title || mediaData.text || videoData.caption || videoData.title || 'Instagram_Video';
    const thumbnail = mediaData.thumbnail || mediaData.thumbnail_url || mediaData.cover || mediaData.image || videoData.thumbnail || videoData.cover || null;
    
    res.json({
      type: type,
      url: mediaUrl,
      thumbnail: thumbnail,
      username: 'instagram_user',
      caption: caption
    });

  } catch (error) {
    console.error(`Error downloading ${type}:`, error.message);
    const apiError = error.response ? JSON.stringify(error.response.data) : error.message;
    res.status(500).json({ error: `Failed to process via Proxy API. Details: ${apiError}` });
  }
};

app.post('/api/download/reel', (req, res) => handleDownload(req, res, 'reels'));
app.post('/api/download/story', (req, res) => handleDownload(req, res, 'story'));
app.post('/api/download/post', (req, res) => handleDownload(req, res, 'posts'));

// Proxy download endpoint — fetches the media from Instagram's CDN and
// streams it back to the browser with headers that force a file download.
app.get('/api/proxy-download', async (req, res) => {
  try {
    const { url, filename, mediaType } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/'
      },
      timeout: 30000
    });

    // Detect the real content type from the server response
    const contentType = response.headers['content-type'] || '';
    let ext = '.mp4';
    if (contentType.includes('image/jpeg')) ext = '.jpg';
    else if (contentType.includes('image/png')) ext = '.png';
    else if (contentType.includes('image/webp')) ext = '.webp';
    else if (contentType.includes('video/mp4')) ext = '.mp4';
    else if (mediaType === 'image') ext = '.jpg'; // fallback hint from frontend

    const safeBase = (filename || 'InstaSave').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const safeFilename = safeBase + ext;

    // Force the browser to download the file instead of opening it
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy download error:', error.message);
    res.status(500).json({ error: 'Failed to proxy download.' });
  }
});

app.listen(PORT, () => {
  console.log(`Production Server is running on port ${PORT}`);
});
