// Init dependencies
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';

const router = Router();



router.post('/register', (req, res) => {
    const { email, password } = req.body;
  
    pool.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (result.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
  
      const salt = bcryptjs.genSaltSync(10);
      const hashedPassword = bcryptjs.hashSync(password, salt);
  
      pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id, email',
        [email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
          }
          const newUser = result.rows[0];
          res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.user_id, email: newUser.email },
          });
        }
      );
    });
  });
  
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      const user = result.rows[0];
      console.log('User from database:', user);
      const passwordMatch = bcryptjs.compareSync(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      const token = jwt.sign(
        { id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.status(200).json({
        message: 'User logged in successfully',
        token: token,
        user: { id: user.user_id, email: user.email },
      });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
  router.delete('/delete-account', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;
  
    try {
      const userResult = await pool.query('SELECT password FROM users WHERE user_id = $1', [userId]);
      const user = userResult.rows[0];
      const passwordMatch = bcryptjs.compareSync(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
      await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    }
  });

  export default router;