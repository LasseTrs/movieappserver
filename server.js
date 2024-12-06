import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { verifyToken } from './verifyToken.js';
import tmdbRouter from './routes/tmdbRouter.js';
import userRouter from './routes/userRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import finnkinoRouter from './routes/finnkinoRouter.js';
import detailRouter from './routes/detailRouter.js';
import memberRouter from './routes/memberRouter.js';
import groupRouter from './routes/groupRouter.js';
import { pool } from './db.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();
const PORT = process.env.PORT;


app.get('/protected', verifyToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
}); 

app.post('/api/groups/', async (req, res) => {
  console.log('toimii1');
    const { name, creator_user_id } = req.body;
    if (!name || !creator_user_id) {
        return res.status(400).json({ error: 'Name and creator_user_id are required' });
    }
    try {
    const query = 'INSERT INTO user_group (name, creator_user_id, created_date) VALUES ($1, $2, NOW()) RETURNING *';
    const values = [name, creator_user_id];
    const result = await pool.query(query, values);
    res.status(201).json({ group: result.rows[0] });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Group is missing user or name' });
}
});

app.delete('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const groupQuery = 'SELECT * FROM user_group WHERE group_id = $1';
        const groupResult = await pool.query(groupQuery, [id]);

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
      }
      const deleteQuery = 'DELETE FROM user_group WHERE group_id = $1';
        await pool.query(deleteQuery, [id]);
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    }
  });

app.get('/api/groups2', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM user_group');
        // res.json({ message: 'toimii grouppi' });
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ error: 'Error fetching user groups' });
    }
  });

app.post('/api/groupstesti', (req, res) => {
    res.send('Group created');  
    console.log('testiconnection')
  });



app.get('/memberlist/:group_id', async (req, res) => {
  const { group_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT u.user_id
        FROM group_members gm
        JOIN users u ON gm.user_id = u.user_id
        WHERE gm.group_id = $1`,
        [group_id]
      ); 
      res.json(result.rows);
    } catch (error) {
      console.error('Error members:', error);
      res.status(500).json({ error: 'Error members' });
    }
  });







 app.get('/member/:group_Id/pendingRequests', async (req, res) => {
    const group_id = req.params.group_Id;
  
    try {
      const result = await pool.query(
        `SELECT r.request_id, r.user_id, r.status
         FROM join_request r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.group_id = $1 AND r.status = 'pending'`,
        [group_id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching pending requests' });
    }
  });

  app.post('/member/:group_Id/accept/:requestId', async (req, res) => {
    const { group_Id, requestId } = req.params;
  
    try {
      const result = await pool.query(
        `UPDATE join_request
         SET status = 'accepted'
         WHERE request_id = $1 AND group_id = $2 AND status = 'pending'
         RETURNING *`,
        [requestId, group_Id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empty request' });
      }
  
      res.json(result.rows[0]); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error' });
    }
  });



  app.post('/member:group_Id/reject/:requestId', async (req, res) => {
    const { group_Id, requestId } = req.params;
  
    try {
      const result = await pool.query(`UPDATE join_request SET status = 'rejected' WHERE request_id = $1 AND group_id = $2 AND status = 'pending' RETURNING *`,
        [requestId, group_Id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empty request' });
      }
      res.json(result.rows[0]); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error' });
    }
  });


  app.post('/groupMember/:group_id/join', async (req, res) => {
    const { group_id } = req.params;
    const { user_id } = req.body;

 console.log()
    try {
       
      const result =  await pool.query(
          `INSERT INTO join_request (group_id, user_id, status) 
           VALUES ($1, $2, 'pending') RETURNING request_id`,
          [group_id, user_id]
      );
        res.json({ message: 'Request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send request' });
    }
});





app.use('/', userRouter);
app.use('/reviews', reviewRouter);
app.use('/finnkino', finnkinoRouter);
app.use('/api', tmdbRouter);
app.use('/details', detailRouter);
//app.use('/member', memberRouter);
//app.use('/api', groupRouter);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});