const jwt = require('jsonwebtoken');
const Admin = require('../model/adminModel');
require('dotenv').config()

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwtAdmin;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.ADMIN_JWT_SECRETKEY, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/admin');
      } else {
        next();
      }
    });
  } else {
    res.redirect('/admin');
  }
};

// check current user
const checkAdmin = (req, res, next) => {
  const token = req.cookies.jwtAdmin;
  if (token) {
    jwt.verify(token, process.env.ADMIN_JWT_SECRETKEY, async (err, decodedToken) => {
      if (err) {
        res.locals.admin = null;
        next();
      } else {
        const admin = await Admin.findById(decodedToken.id);
        res.locals.admin = admin;
        next();
      }
    });
  } else {
    res.locals.admin = null;
    next();
  }
};
const requireAuth1 = (req, res, next) => {
    const token = req.cookies.jwtAdmin;
  
    // check json web token exists & is verified
    if (token) {
      jwt.verify(token, process.env.ADMIN_JWT_SECRETKEY, (err, decodedToken) => {
        if (err) {
          next()
        } else {
          res.redirect("/admin/dashboard")
        }
      });
    } else {
      next()
    }
  };


module.exports = { requireAuth, checkAdmin ,requireAuth1};