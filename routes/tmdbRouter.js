import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from '../db.js';
dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

app.get('/movies', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular`,
      {
        params: {
          language: 'en-US',
          page: 1,
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from TMDb:', error);
    res.status(500).json({ error: 'Failed to fetch data from TMDb' });
  }
});

app.get('/tv', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/popular`,
      {
        params: {
          language: 'en-US',
          page: 1,
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching TV shows from TMDb:', error);
    res.status(500).json({ error: 'Failed to fetch TV shows from TMDb' });
  }
});

app.get('/person', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/person/popular`,
      {
        params: {
          language: 'en-US',
          page: 1
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular people from TMDb:', error);
    res.status(500).json({ error: 'Failed to fetch popular people from TMDb' });
  }
});

app.get('/search', async (req, res) => {
  const { userQuery } = req.query;
  if (!userQuery || userQuery.trim() === '') {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/multi`,
      {
        params: {
          query: userQuery,
          language: 'en-US',
          page: 1
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching search results from TMDb:', error);
    res.status(500).json({ error: 'Failed to fetch search results from TMDb' });
  }
});

app.get('/get-tmdb-id', async (req, res) => {
  const { title, year } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Check if the mapping exists in the database
    const mappingResult = await pool.query(
      'SELECT tmdb_id FROM movie_mappings WHERE local_title = $1 AND release_year = $2',
      [title, year || null]
    );

    if (mappingResult.rows.length > 0) {
      // Mapping exists
      const tmdb_id = mappingResult.rows[0].tmdb_id;
      return res.json({ tmdb_id });
    } else {
      // Mapping doesn't exist, search TMDB API
      const tmdbToken = process.env.TMDB_BEARER_TOKEN;

      const options = {
        method: 'GET',
        url: 'https://api.themoviedb.org/3/search/multi',
        params: {
          query: title,
          include_adult: 'false',
          language: 'en-US',
          page: '1',
          year: year ? year.toString() : undefined,
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      };

      const response = await axios.request(options);

      if (response.data.results && response.data.results.length > 0) {
        const filteredResults = response.data.results.filter(
          (result) => result.media_type === 'movie' || result.media_type === 'tv'
        );
        if (filteredResults.length > 0) {
          const mediaResult = filteredResults[0];
          const tmdb_id = mediaResult.id;
          const media_type = mediaResult.media_type; // movie or tv into the db

        // Insert mapping into database
        await pool.query(
          'INSERT INTO movie_mappings (local_title, release_year, tmdb_id) VALUES ($1, $2, $3)',
          [title, year || null, tmdb_id]
        );

        return res.json({ tmdb_id });
      } else {
        console.error('Movie not found in TMDB:', title, year);
        return res.status(404).json({ error: 'Movie not found in TMDB' });
      }
    }
  }
  } catch (error) {
    console.error('Error fetching TMDB ID:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching TMDB ID' });
  }

});

export default app;