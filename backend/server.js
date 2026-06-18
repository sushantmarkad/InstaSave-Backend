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
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com';

app.post('/api/download/reel', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!RAPIDAPI_KEY) {
      console.warn("No RAPIDAPI_KEY provided, returning mock data.");
      return res.json({
        type: 'reels',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop',
        username: 'mock_user'
      });
    }

    // Call the Managed Scraper API
    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}/instagram/`, // Updated endpoint for this specific API
      params: { url: url }, // Some APIs use 'url', 'ig', or 'link'
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const videoData = response.data;

    // Check if the API returned an error inside a 200 OK
    if (videoData.status === false) {
      throw new Error(videoData.message || "Invalid URL or API rejected the request.");
    }
    
    // Parse the API response (this API seems to return data in 'result' if successful)
    const mediaUrl = videoData.result || videoData.media || videoData[0]?.url || videoData.video_url;
    
    if (!mediaUrl) {
      throw new Error("Could not find video URL in the API response.");
    }
    
    res.json({
      type: 'reels',
      url: mediaUrl,
      thumbnail: videoData.thumbnail || 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop',
      username: 'instagram_user'
    });

  } catch (error) {
    console.error('Error downloading reel:', error.message);
    const apiError = error.response ? JSON.stringify(error.response.data) : error.message;
    res.status(500).json({ error: `Failed to process via Proxy API. Details: ${apiError}` });
  }
});

app.post('/api/download/story', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.json({
        type: 'story',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop',
        username: username
      });
    }

    // Fetch story via Proxy API
    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}/story`,
      params: { url: `https://instagram.com/${username}` },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const storyData = response.data;

    res.json({
      type: 'story',
      url: storyData.media || storyData[0]?.url,
      thumbnail: storyData.thumbnail,
      username: username
    });

  } catch (error) {
    console.error('Error downloading story:', error.message);
    res.status(500).json({ error: 'Failed to fetch stories via Proxy API.' });
  }
});

app.listen(PORT, () => {
  console.log(`Production Server is running on port ${PORT}`);
});
