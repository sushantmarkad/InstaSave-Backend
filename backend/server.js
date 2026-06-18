const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Dummy function to simulate a scraper just in case the real ones fail due to Instagram's new blocks
const scrapeInstagram = async (url, type) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    data: {
      type: type,
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop',
      username: type === 'story' ? url : 'instagram_user'
    }
  };
};

app.post('/api/download/reel', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Attempt to download using an external package or fallback to mock
    // In a real production app, we would use a library like 'aetherz-downloader'
    // const scraper = require('aetherz-downloader');
    // const result = await scraper.igdl(url);
    
    // For now we will use our mock since Instagram aggressively blocks servers
    const result = await scrapeInstagram(url, 'reels');
    res.json(result);

  } catch (error) {
    console.error('Error downloading reel:', error);
    res.status(500).json({ error: 'Failed to process the Instagram link. Make sure the account is public.' });
  }
});

app.post('/api/download/story', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Note: Downloading stories usually requires authentication.
    // For this demo, we mock the response.
    const result = await scrapeInstagram(username, 'story');
    res.json(result);

  } catch (error) {
    console.error('Error downloading story:', error);
    res.status(500).json({ error: 'Failed to fetch stories. Make sure the account is public.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
