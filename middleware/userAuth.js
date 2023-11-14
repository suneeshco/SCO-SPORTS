const jwt = require('jsonwebtoken');
const User = require('../model/customerModel');
require('dotenv').config(); // Module to Load environment variables from .env file

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.USER_JWT_SECRETKEY, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/user/login');
      } else {
        next();
      }
    });
  } else {
    res.redirect('/user/login');
  }
};
const requireAuth1 = (req, res, next) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.USER_JWT_SECRETKEY, (err, decodedToken) => {
      if (err) {
        next()
      } else {
        res.redirect("/userHome")
      }
    });
  } else {
    next()
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token,  process.env.USER_JWT_SECRETKEY, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        const user = await User.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};


module.exports = { requireAuth, checkUser,requireAuth1 };