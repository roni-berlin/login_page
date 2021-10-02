const express = require("express");
const app = express();
const { auth, verifySession } = require("./middleware/auth");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { mongoose } = require("./db/mongoose");
const { User } = require("./db/models/user.model");
app.post("/sign-up", (req, res) => {
  const newUser = new User(req.body.data);
  User.findOne({
    email: newUser.email,
  }).then((userFind) => {
    if (userFind) {
      res.status(409).send("user is already exists");
    } else {
      newUser
        .save()
        .then(() => newUser.createSession())
        .then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user
          return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
            .cookie("refreshToken", authTokens.refreshToken, {
              maxAge: process.env.REFRESH_TOKEN_COOKIE_EXPIRE,
            })
            .cookie("accessToken", authTokens.accessToken, {
              maxAge: process.env.ACCESS_TOKEN_COOKIE_EXPIRE,
            })
            .cookie("_id", newUser._id, {
              maxAge: process.env.REFRESH_TOKEN_COOKIE_EXPIRE,
            })
            .send(newUser);
        })
        .catch((e) => {
          res.status(400).send(e);
        });
    }
  });
});
app.post("/sign-in", (req, res) => {
  const user = req.body.data;
  User.findByCredentials(user.email, user.password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
            .cookie("refreshToken", authTokens.refreshToken, {
              maxAge: process.env.REFRESH_TOKEN_COOKIE_EXPIRE,
            })
            .cookie("accessToken", authTokens.accessToken, {
              maxAge: process.env.ACCESS_TOKEN_COOKIE_EXPIRE,
            })
            .cookie("_id", user._id, {
              maxAge: process.env.REFRESH_TOKEN_COOKIE_EXPIRE,
            })
            .send(user);
        });
    })
    .catch((e) => {
      res.status(400).send("Invalid Email Or Password");
    });
});

app.post("/validate", auth, (req, res) => {
  User.findById(req.user_id)
    .then((user) => {
      res.send(user);
    })
    .catch((e) => res.send(e));
});

app.post("/refresh-token", verifySession, (req, res) => {
  // we know that the user/caller is authenticated and we have the user_id and user object available to us
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res
        .cookie("accessToken", accessToken, {
          maxAge: process.env.ACCESS_TOKEN_COOKIE_EXPIRE,
        })
        .send({ accessToken });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(` Server is listening on port ${port}`);
});
