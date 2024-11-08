import jwt from 'jsonwebtoken';

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (token === null) {
        return res.status(401).json({ message: "No access token" });
    }

    jwt.verify(token, process.env.MY_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Access token is invalid" });
        }

        req.user = user;
        next();
    });
};

export default verifyJWT;
