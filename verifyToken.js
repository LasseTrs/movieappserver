import jwt from 'jsonwebtoken';

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
      const bearerToken = bearerHeader.split(' ')[1];
      jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('Token verification error:', err);
          return res.status(403).json({ message: 'Invalid token' });
        } else {
          console.log('Decoded token:', decoded);
          req.user = decoded;
          next();
        }
      });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }

  export { verifyToken };