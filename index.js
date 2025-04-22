const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

app.get('/auth', (req, res) => {
  const authURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline&prompt=consent`;
  res.redirect(authURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/list-files', async (req, res) => {
  const { access_token, folderId } = req.query;

  const queryParts = ["mimeType='application/pdf'"];
  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }
  const query = queryParts.join(" and ");

  try {
    const { data } = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      params: {
        q: query,
        fields: 'files(id, name)',
      },
    });
    res.json(data);
  } catch (error) {
    console.error("❌ Google API error:", error.response?.data || error.message);
    res.status(500).json({ error: error.toString() });
  }
});

// ✅ This is the key change
module.exports = app;
