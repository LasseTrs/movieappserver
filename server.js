import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { verifyToken } from './verifyToken.js';
import tmdbRouter from './routes/tmdbRouter.js';
import userRouter from './routes/userRouter.js'
import reviewRouter from './routes/reviewRouter.js';
import finnkinoRouter from './routes/finnkinoRouter.js';
import detailRouter from './routes/detailRouter.js';
import memberRouter from './routes/memberRouter.js';
import groupRouter from './routes/groupRouter.js';
import groupMemberRouter from './routes/groupMemberRouter.js'
import favoritesRouter from './routes/favoritesRouter.js';



const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();
const PORT = 3001;




app.get('/protected', verifyToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
}); 










app.use('/', favoritesRouter);
app.use('/', userRouter);
app.use('/reviews', reviewRouter);
app.use('/finnkino', finnkinoRouter);
app.use('/api', tmdbRouter);
app.use('/details', detailRouter);
app.use('/member', memberRouter);
app.use('/api/groups', groupRouter);
app.use('/api/groups2', groupRouter);
app.use('/groupMember', groupMemberRouter);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
