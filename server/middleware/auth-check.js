const jwt = require('jsonwebtoken');
const User = require('mongoose').model('User');

module.exports = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).end();
  }

  // get the last part from an authorisation header string like "bearer token-value"
  // or just the auth from the header?
  const token = req.headers.authorization; // .split(' ')[1];

  // decode the token using a secret key-phrase
  return jwt.verify(token, process.env.jwtSecret, (err, decoded) => {
    // the 401 code is for unauthorized status
    if (err) { return res.status(401).end(); }

    const userId = decoded.sub;

    // check if a user exists
    return User.findById(userId, (userErr, user) => {
      if (userErr || !user) {
        return res.status(401).end();
      }
      req.user = user;

      return next();
    });
  });
};
