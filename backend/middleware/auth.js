const jwt = require("jsonwebtoken");
const { User } = require("../db/models/user.model");
require("dotenv").config();

// check whether the request has a valid JWT access toke
module.exports = {
  auth: function (req, res, next) {
    const token = req.body.accessToken;
    // verify the JWT
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        // there was an error
        // jwt is invalid - * DO NOT AUTHENTICATE *
        res.status(401).send(err);
      } else {
        // jwt is valid
        req.user_id = decoded._id;
        next();
      }
    });
  },

  // Verify Refresh Token Middleware (which will be verifying the session)
  verifySession: function (req, res, next) {
    const refreshToken = req.body.refreshToken;
    const _id = req.body._id;
    User.findByIdAndToken(_id, refreshToken)
      .then((user) => {
        if (!user) {
          // user couldn't be found
          return Promise.reject({
            error:
              "User not found. Make sure that the refresh token and user id are correct",
          });
        }
        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not
        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
          if (session.token === refreshToken) {
            // check if the session has expired
            if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
              // refresh token has not expired
              isSessionValid = true;
            }
          }
        });

        if (isSessionValid) {
          // the session is VALID - call next() to continue with processing this web request
          next();
        } else {
          // the session is not valid
          return Promise.reject({
            error: "Refresh token has expired or the session is invalid",
          });
        }
      })
      .catch((e) => {
        res.status(401).send(e);
      });
  },
};
