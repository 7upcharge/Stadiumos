import rateLimit from 'express-rate-limit';

// Standard rate limiter: limit requests to 100 per 15 minutes
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter rate limiter for expensive AI completion and simulation calls
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many simulation requests. Please wait a minute before making more requests.'
  }
});
