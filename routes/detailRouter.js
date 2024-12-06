import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const TMDB_TOKEN = process.env.TMDB_TOKEN;

router.get('/:category/:id', async (req, res) => {
  let { category, id } = req.params;
  if (category === 'movies') category = 'movie';

  const url = `https://api.themoviedb.org/3/${category}/${id}`;
  const options = {
    params: {
      language: 'en-US',
    },
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_TOKEN}`,
    },
  };

  try {
    const response = await axios.get(url, options);
    res.json(response.data);
  } catch (error) {
    console.error(
      'Error fetching details:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

export default router;