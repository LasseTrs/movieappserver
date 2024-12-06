import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';


const router = Router();
/*
router.get('/member/:groupId/pendingRequests', async (req, res) => {
    const groupId = req.params.groupId;
  
    try {
      const result = await pool.query(
        `SELECT r.request_id, r.user_id, r.status
         FROM join_request r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.group_id = $1 AND r.status = 'pending'`,
        [groupId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching pending requests' });
    }
  });

  router.post('/member/:groupId/accept/:requestId', async (req, res) => {
    const { groupId, requestId } = req.params;
  
    try {
      const result = await pool.query(
        `UPDATE join_request
         SET status = 'accepted'
         WHERE request_id = $1 AND group_id = $2 AND status = 'pending'
         RETURNING *`,
        [requestId, groupId]
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



  router.post('/member/:groupId/reject/:requestId', async (req, res) => {
    const { groupId, requestId } = req.params;
  
    try {
      const result = await pool.query(
        `UPDATE join_request
         SET status = 'rejected'
         WHERE request_id = $1 AND group_id = $2 AND status = 'pending'
         RETURNING *`,
        [requestId, groupId]
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
  



  */
  export default router;



