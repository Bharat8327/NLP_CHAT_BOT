import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const authMW = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return res.status(401).json({ error: 'Not authorized - Access Token Missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // 1. Device Footprint Validation (Prevent Stolen Token usage)
    const currentAgent = req.headers['user-agent'] || 'unknown';
    const currentFp = crypto.createHash('sha256').update(currentAgent).digest('hex');
    
    if (decoded.fp !== currentFp) {
      return res.status(401).json({ error: 'Token theft detected / Session Invalidated' });
    }

    // 2. CSRF Native Double-Submit Validation
    // Avoid CSRF check on pristine GET requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const headerCsrf = req.headers['x-xsrf-token'];
      if (!headerCsrf || decoded.csrf !== headerCsrf) {
        return res.status(403).json({ error: 'CSRF Signature Mismatch' });
      }
    }

    // Allow execution
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or Expired JWT' });
  }
};

export default authMW;
