// Init dependencies
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';
import crypto from 'crypto';

const router = Router();
router.post('/token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    // Hash the provided refresh token
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if hashed token exists in the database and is not expired
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expiration_date > NOW()',
      [hash]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify the refresh token
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        console.error('Refresh token verification error:', err);
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const userId = decoded.id;
      const email = decoded.email;

      // Create new access token
      const accessToken = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

router.post('/register', (req, res) => {
    const { email, password } = req.body;
    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password doesn't meet the requirements" });
    }
  
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
      // Fetch user from the database
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      const user = result.rows[0];
      console.log('User from database:', user);
  
      // Compare the provided password with the stored hashed password
      const passwordMatch = bcryptjs.compareSync(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      const userId = user.user_id;
  
      // Create JWT access token (expires in 15 minutes)
      const accessToken = jwt.sign(
        { id: userId, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
  
      // Create JWT refresh token (expires in 7 days)
      const refreshToken = jwt.sign(
        { id: userId, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      // Calculate expiration date for the refresh token
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      // Hash the refresh token before storing
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      // Store hashed refresh token in the database
      await pool.query(
        'INSERT INTO refresh_tokens (token, user_id, expiration_date) VALUES ($1, $2, $3)',
        [hash, userId, expirationDate]
      );
      // Send tokens to the client
      res.status(200).json({
        message: 'User logged in successfully',
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: { id: userId, email: user.email },
      });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    }
  });

  router.post('/logout', async (req, res) => {
    const { token } = req.body;
  
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
  
    try {
      // Hash the provided refresh token
      const hash = crypto.createHash('sha256').update(token).digest('hex');
  
      // Delete the hashed refresh token from the database
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [hash]);
  
      res.status(200).json({ message: 'Logged out successfully' });
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

  router.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const userResult = await pool.query(
        'SELECT user_id, email FROM users WHERE user_id = $1',
        [userId]
      );
  
      const user = userResult.rows[0];
      // Fetch the user's favorite list_id
      const listResult = await pool.query(
        'SELECT favorite_list_id FROM favorite_list WHERE user_id = $1',
        [userId]
      );
      const favorite_list_id = listResult.rows.length > 0 ? listResult.rows[0].favorite_list_id : null;

      return res.json({
        user_id: user.user_id,
        email: user.email,
        favorite_list_id
      });
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
  });

  export default router;