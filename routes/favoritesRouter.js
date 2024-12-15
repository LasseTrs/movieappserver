// Init dependencies
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';
import crypto from 'crypto';
const router = Router();

router.get('/favorites/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const publicLists = await pool.query(
        'SELECT favorite_list_id FROM favorite_list WHERE user_id = $1 AND public = TRUE',
        [userId]
      );
  
      const listIds = publicLists.rows.map(row => row.favorite_list_id);
      if (listIds.length === 0) {
        return res.json([]); 
      }
      const favoritesQuery = `
        SELECT flm.tmdb_id, mm.local_title AS title
        FROM favorite_list_movies flm
        JOIN movie_mappings mm ON flm.tmdb_id = mm.tmdb_id
        WHERE flm.favorite_list_id = ANY($1::int[]);`;
      const favoriteMovies = await pool.query(favoritesQuery, [listIds]);
      return res.json(favoriteMovies.rows);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({ error: 'Error fetching favorites' });
    }
  });
  
  router.post('/favorites/add', async (req, res) => {
    const { user_id, tmdb_id } = req.body;
    if (!user_id || !tmdb_id) {
      return res.status(400).json({ error: 'user_id and tmdb_id are required' });
    }
    try {
      let userList = await pool.query(
        'SELECT favorite_list_id FROM favorite_list WHERE user_id = $1', // Check if list exists
        [user_id]
      );

      let favorite_list_id;
      if (userList.rows.length === 0) {
        const newList = await pool.query(
          'INSERT INTO favorite_list (user_id, name, public) VALUES ($1, $2, $3) RETURNING favorite_list_id', // No list, create one
          [user_id, 'My Favorites', true] // Default list name
        );
        favorite_list_id = newList.rows[0].favorite_list_id;
      } else {
        favorite_list_id = userList.rows[0].favorite_list_id;
      }

      const movieCheck = await pool.query(
        'SELECT * FROM favorite_list_movies WHERE favorite_list_id = $1 AND tmdb_id = $2', // Check if movie is already in list
        [favorite_list_id, tmdb_id]
      );
      if (movieCheck.rows.length > 0) {
        return res.status(200).json({ message: 'Movie already in favorites' });
      }
      await pool.query(
        'INSERT INTO favorite_list_movies (favorite_list_id, tmdb_id) VALUES ($1, $2)', // Insert movie into list
        [favorite_list_id, tmdb_id]
      );
  
      return res.status(200).json({ message: 'Movie added to favorites' });
    } catch (error) {
      console.error('Error adding movie to favorites:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/favorites/delete', async (req, res) => {
    const { user_id, tmdb_id } = req.body;
    if (!user_id || !tmdb_id) {
      return res.status(400).json({ error: 'user_id and tmdb_id are required' });
    }
    try {
      const userList = await pool.query(
        'SELECT favorite_list_id FROM favorite_list WHERE user_id = $1',
        [user_id]
      );
      if (userList.rows.length === 0) {
        return res.status(404).json({ error: 'No favorites list found for this user' });
      }
  
      const favorite_list_id = userList.rows[0].favorite_list_id;
      const deleteResult = await pool.query(
        'DELETE FROM favorite_list_movies WHERE favorite_list_id = $1 AND tmdb_id = $2 RETURNING *',
        [favorite_list_id, tmdb_id]
      );
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ error: 'Movie not found in favorites' });
      }
  
      return res.status(200).json({ message: 'Movie removed from favorites' });
    } catch (error) {
      console.error('Error removing movie from favorites:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/api/favorites/is-favorite', async (req, res) => {
    // check favorite status when movie details are loaded
    const { user_id, tmdb_id } = req.query;
    if (!user_id || !tmdb_id) {
      return res.status(400).json({ error: 'user_id and tmdb_id are required' });
    }
    try {
      const listResult = await pool.query(
        'SELECT favorite_list_id FROM favorite_list WHERE user_id = $1',
        [user_id]
      );
      if (listResult.rows.length === 0) {
        return res.json({ isFavorite: false });
      }
      const favorite_list_id = listResult.rows[0].favorite_list_id;
      const movieCheck = await pool.query(
        'SELECT 1 FROM favorite_list_movies WHERE favorite_list_id = $1 AND tmdb_id = $2',
        [favorite_list_id, tmdb_id]
      );
  
      const isFavorite = movieCheck.rows.length > 0;
      return res.json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/share/:favorite_list_id', async (req, res) => {
    const { favorite_list_id } = req.params;
  
    try {
      // Check if the list is public
      const listResult = await pool.query(
        'SELECT favorite_list_id, user_id, name, public FROM favorite_list WHERE favorite_list_id = $1 AND public = TRUE',
        [favorite_list_id]
      );
      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'Public favorite list not found' });
      }
      const list = listResult.rows[0];
      
      const userResult = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [list.user_id]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const userEmail = userResult.rows[0].email;
      // Get all movies in this list
      const moviesResult = await pool.query(
        `SELECT mm.tmdb_id, mm.local_title
         FROM favorite_list_movies flm
         JOIN movie_mappings mm ON flm.tmdb_id = mm.tmdb_id
         WHERE flm.favorite_list_id = $1`,
        [favorite_list_id]
      );
      return res.json({
        favorite_list_id: list.favorite_list_id,
        user_id: list.user_id,
        email: userEmail,
        name: list.name,
        movies: moviesResult.rows
      });
    } catch (error) {
      console.error('Error fetching public favorites:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  export default router;