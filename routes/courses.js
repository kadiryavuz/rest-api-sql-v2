const express = require("express");
const router = express.Router();

const db = require("../models");
const { check, validationResult } = require("express-validator");
const authenticateUser = require("../functions");

//returns all the courses
router.get("/", async (req, res) => {
  //find all courses
  const courseList = await db.Course.findAll({
    attributes: [
      "id",
      "userId",
      "title",
      "description",
      "estimatedTime",
      "materialsNeeded",
    ],
  });
  if (courseList) {
    res.status(200).json(courseList);
  } else {
    res
      .status(500)
      .json({ message: "Something went wrong while fetching Course(s)" });
  }
});

//returns specific course which it's id is equal to the param id
router.get("/:id", async (req, res) => {
  const course = await db.Course.findOne({
    attributes: [
      "id",
      "userId",
      "title",
      "description",
      "estimatedTime",
      "materialsNeeded",
    ],
    where: { id: Number(req.params.id) },
  });
  if (course) {
    res.status(200).json(course);
  } else {
    res.status(500).json({
      message: `Something went wrong while fetching Course with id: ${req.params.id}`,
    });
  }
});

//creating course record - protected route
router.post(
  "/",
  [
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'title'"),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'description'"),
  ],
  authenticateUser,
  async (req, res) => {
    const errors = validationResult(req);
    const user = req.currentUser;
    console.log("reqUser on Course POST: ", user);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      const course = req.body;

      //normalizing the course body with current authenticated user's id
      //since only an authenticated user can enter his/ her own course
      //if I see an userId in the req body following line will normalize it with correct value
      const finalCourse = { ...course, userId: user.id };

      const recCourse = await db.Course.create(finalCourse);
      if (recCourse) {
        res.location("/");
        res.status(201).end();
      } else {
        res
          .status(500)
          .json({ message: "Something went wrong while creating Course" });
      }
      //then
      res.status(201).end();
    }
  }
);

//updates course  - protected route
//additionally checks if the authenticated user owns the course
router.put(
  "/:id",
  [
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'title'"),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for 'description'"),
  ],
  authenticateUser,
  async (req, res) => {
    const user = req.currentUser;
    const courseRec = await db.Course.findOne({
      where: { id: Number(req.params.id) },
    });
    if (courseRec) {
      if (courseRec.userId === user.id) {
        courseRec.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).json({
          message: "Unauthorized Update: User doesn't own the requested course",
        });
      }
    } else {
      res
        .status(500)
        .json({ message: "Something went wrong while updating Course" });
    }
  }
);


//deletes course
//additionally checks if authenticated user owns the requested course
router.delete("/:id", authenticateUser, async (req, res) => {
  const user = req.currentUser;
  const courseRec = await db.Course.findOne({
    where: { id: Number(req.params.id) },
  });

  if (courseRec) {
    if (courseRec.userId === user.id) {
      courseRec.destroy();
      res.status(204).end();
    } else {
      res.status(403).json({
        message: "Unauthorized Delete: User doesn't own the requested course",
      });
    }
  } else {
    res
      .status(500)
      .json({ message: "Something went wrong while deleting Course" });
  }
});

module.exports = router;
