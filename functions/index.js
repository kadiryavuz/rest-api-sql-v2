const express = require("express");
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");
const db = require("../models");


// autheticate user middleware to be use with protected routes where necessary
const authenticateUser = async (req, res, next) => {
  let retMsg = null;

  // Parse the user's authHeader from the Authorization header.
  const authHeader = auth(req);

  // If the user's authHeader are available...
  if (authHeader) {
    const user = await db.User.findOne({
      where: { emailAddress: authHeader.name },
    });

    if (user) {
      const authenticated = bcryptjs.compareSync(
        authHeader.pass,
        user.password
      );

      if (authenticated) {
        console.log(
          `Successfully authenticated for username: ${user.emailAddress}`
        );
        req.currentUser = user;
      } else {
        retMsg = `Authentication failed for username: ${user.emailAddress}`;
      }
    } else {
      retMsg = `User ${authHeader.name} not found!`;
    }
  } else {
    retMsg = "Auth header not found";
  }

  if (retMsg) {
    // If user authentication failed...
    console.warn(retMsg);
    res.status(401).json({ message: "Access Denied" });
  } else {
    // Or if user authentication succeeded...
    next();
  }
};

module.exports = authenticateUser;
