// Init dependencies
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';
const router = Router();

router.get('/all-reviews', async (req, res) => {
    try {
      const reviewsResult = await pool.query(
        'SELECT users.email, movie_mappings.local_title, review.tmdb_id, review.text, review.stars, review.timestamp FROM review INNER JOIN users ON review.user_id = users.user_id INNER JOIN movie_mappings ON review.tmdb_id = movie_mappings.tmdb_id ORDER BY review.timestamp DESC LIMIT 20 OFFSET 0;');
  
      res.json(reviewsResult.rows);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ error: 'Error fetching reviews' });
    }
});

router.get('/get-reviews', async (req, res) => {
    const { tmdb_id } = req.query;
  
    if (!tmdb_id) {
      return res.status(400).json({ error: 'tmdb_id is required' });
    }
  
    try {
      const reviewsResult = await pool.query(
        'SELECT r.text, r.stars, r.timestamp, u.email AS user_email FROM review r JOIN users u ON r.user_id = u.user_id WHERE r.tmdb_id = $1',
        [tmdb_id]
      );
  
      res.json(reviewsResult.rows);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ error: 'Error fetching reviews' });
    }
  });

router.post('/add-review', async (req, res) => {
    const { user_id, tmdb_id, text, stars } = req.body;
  
    if (!user_id || !tmdb_id || !text || !stars) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      await pool.query(
        'INSERT INTO review (user_id, tmdb_id, text, stars) VALUES ($1, $2, $3, $4)',
        [user_id, tmdb_id, text, stars]
      );
  
      res.json({ message: 'Review submitted successfully' });
    } catch (error) {
      console.error('Error submitting review:', error.message);
      res.status(500).json({ error: 'Error submitting review' });
    }
  });

router.delete('/delete-review/:id', verifyToken, async (req, res) => {
});

export default router;

