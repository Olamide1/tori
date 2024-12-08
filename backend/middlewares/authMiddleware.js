const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const header = req.header("Authorization");
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

const validateQuerySafety = (req, res, next) => {
  const { query } = req.body;
  if (/drop\s+table|delete\s+from/i.test(query)) {
    return res.status(400).json({ message: "Destructive queries are not allowed." });
  }
  next();
};


module.exports = { verifyToken, validateQuerySafety };
