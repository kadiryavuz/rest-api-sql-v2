const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");

const db = require("../models");
const authenticateUser = require("../functions");

// GET /api/users 200 - Returns the currently authenticated user
// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content

// Returns the currently authenticated user
router.get("/", authenticateUser, async (req, res) => {
  const user = req.currentUser;

  const recUser = await db.User.findOne({
    attributes: ["id", "firstName", "lastName", "emailAddress"],
    where: { id: user.id },
  });
  if (recUser) {
    res.status(200).json(recUser);
  } else {
    //very unlikely but still handling it :)
    res.status(500).json({
      message: `Something went wrong while fetching the authenticated user with email: ${user.emailAddress}`,
    });
  }
});

//Creates a user, sets the Location header to "/", and returns no content
//Validates each field in the req body with custom error messages
//Validates that the provided email address isn't already associated with an existing user record.
router.post(
  "/",
  [
    check("firstName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'firstName'"),
    check("lastName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'lastName'"),
    check("emailAddress")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'emailAddress'")
      .bail() // if no emailAddress value provided then skip rest
      .isEmail()
      .withMessage("Please provide a valid value for 'emailAddress'"),
    check("emailAddress").custom((value) => {
      return db.User.findOne({ where: { emailAddress: value } }).then(
        (user) => {
          if (user) {
            return Promise.reject("E-mail already in use");
          }
        }
      );
    }),
    check("password")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'password'"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);

      res.status(400).json({ errors: errorMessages });
    }

    const user = req.body;
    user.password = bcryptjs.hashSync(user.password);

    const recUser = await db.User.create(user);
    if (recUser) {
      res.location("/");
      res.status(201).end();
    } else {
      res
        .status(500)
        .json({ message: "Something went wrong while creating User" });
    }
  }
);

module.exports = router;
