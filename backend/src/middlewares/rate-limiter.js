
const MAX_REQUESTS = 100; // Max requests per IP in the time window
const TIME_WINDOW_MS = 60000; // 60 seconds

// In-memory storage for tracking requests by IP address
const requestCounts = new Map();

/**
 * limits the number of request from a user in fixed-window mode.
 * @param {object} req 
 * @param {object} res 
 * @returns {boolean}
 */
export default function rateLimiter(req, res, next){

    const clientIp = req.ip;
    const now = Date.now();
    let clientData = requestCounts.get(clientIp) || {count: 0, resetTime: now + TIME_WINDOW_MS};

    if(now > clientData.resetTime){
        clientData = {count: 0, resetTime: now + TIME_WINDOW_MS};
    }

    clientData.count++;

    if(clientData.count > MAX_REQUESTS){
        requestCounts.set(clientIp, clientData);
        res.status(429).json({
            message: 'Rate limit exceeded. Try again later.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000) + 's'
        });
    }

    requestCounts.set(clientIp, clientData);
    next();
}