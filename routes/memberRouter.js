import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import Router from 'express';
import { verifyToken } from '../verifyToken.js';


const router = Router();


router.get('/member/list/:group_id', async (req, res) => {
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


  router.delete('/member/:groupId/remove/:requestId', async (req, res) => {
    const { groupId, requestId } = req.params;
    try {
        const result = await db.query(
        'DELETE FROM join_request WHERE request_id = $1 AND group_id = $2',
        [requestId, groupId]
      );
    if (result.rowCount === 0) {
     return res.status(404).json({ message: 'request not found' });
      }
     res.status(200).json({ message: 'deleted' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  router.post('/member/:group_Id/accept/:requestId', async (req, res) => {
    const { group_Id, requestId } = req.params;
  console.log("accept access")
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
      const userId = result.rows[0].user_id;
      const insertResult = await pool.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'member') RETURNING *`,
        [group_Id, userId]
 );
    if (insertResult.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to add user to group' });
    }
    res.json({
      message: 'Request accepted and user added to group',
      member: insertResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  



router.get('/member/:group_Id/pendingRequests', async (req, res) => {
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





 router.post('/member:group_Id/reject/:requestId', async (req, res) => {
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





  export default router;



