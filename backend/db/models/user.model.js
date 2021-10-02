const mongoose = require("mongoose");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 3,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      minlength: 8,
    },

    sessions: {
      type: [
        {
          token: {
            type: String,
            required: true,
          },
          expiresAt: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  },
  { versionKey: false }
);

// *** Instance methods ***

UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  // return the document except the password and sessions (these shouldn't be made available)
  return _.omit(userObject, ["password", "sessions"]);
};

UserSchema.methods.generateAccessAuthToken = function () {
  const user = this;
  return new Promise((resolve, reject) => {
    // Create the JSON Web Token and return that
    jwt.sign(
      { _id: user._id.toHexString() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME },
      (err, token) => {
        if (!err) {
          resolve(token);
        } else {
          reject();
        }
      }
    );
  });
};

UserSchema.methods.generateRefreshAuthToken = function () {
  // This method simply generates a 64byte hex string - it doesn't save it to the database. saveSessionToDatabase() does that.
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (!err) {
        const token = buf.toString("hex");

        return resolve(token);
      }
    });
  });
};

UserSchema.methods.createSession = function () {
  const user = this;

  return user
    .generateRefreshAuthToken()
    .then((refreshToken) => {
      return saveSessionToDatabase(user, refreshToken);
    })
    .then((refreshToken) => {
      // saved to database successfully
      // now return the refresh token
      return refreshToken;
    })
    .catch((e) => {
      return Promise.reject("Failed to save session to database.\n" + e);
    });
};

/* MODEL METHODS (static methods) */

UserSchema.statics.findByIdAndToken = function (_id, token) {
  // finds user by id and token
  // used in auth middleware (verifySession)

  const User = this;

  return User.findOne({
    _id,
    "sessions.token": token,
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  const User = this;

  return User.findOne({ email }).then((user) => {
    if (!user) return Promise.reject();

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

UserSchema.statics.hasRefreshTokenExpired = function (expiresAt) {
  let secondsSinceEpoch = Date.now() / 1000;
  if (expiresAt > secondsSinceEpoch) {
    // hasn't expired
    return false;
  } else {
    // has expired
    return true;
  }
};

/* MIDDLEWARE */
// Before a user document is saved, this code runs
UserSchema.pre("save", function (next) {
  let user = this;
  let costFactor = 10;

  if (user.isModified("password")) {
    // if the password field has been edited/changed then run this code.

    // Generate salt and hash password
    bcrypt.genSalt(costFactor, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

/* HELPER METHODS */
let saveSessionToDatabase = function (user, refreshToken) {
  // Save session to database
  return new Promise((resolve, reject) => {
    let expiresAt = generateRefreshTokenExpiryTime();

    user.sessions.push({ token: refreshToken, expiresAt });

    user
      .save()
      .then(() => {
        // saved session successfully
        return resolve(refreshToken);
      })
      .catch((e) => {
        reject(e);
      });
  });
};

let generateRefreshTokenExpiryTime = function () {
  let daysUntilExpire = process.env.REFRESH_TOKEN_EXPIRE_DAYS;
  let secondsUntilExpire = daysUntilExpire * 24 * 60 * 60;
  return Date.now() / 1000 + secondsUntilExpire;
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };
