const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");

// new plant
router.post("/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  var plant_id = new mongoose.Types.ObjectId();
  var name = req.body.name;
  var cover_image = req.body.cover_image;

  if (name == undefined || cover_image == undefined) {
    res.status(400).send("plant details must be specified");
  } else {
    var plantObj = {
      _id: plant_id,
      name: name,
      cover_image: cover_image,
      activities: []
    };

    plantCollection.findOne(
      { owner_id: owner_id, "plants.name": name },
      { "plants.$": 1 },
      function(err, item) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (item == null) {
            newPlant();
          } else {
            res.status(400).send("this plant is exists");
          }
        }
      }
    );

    function newPlant() {
      plantCollection.findOneAndUpdate(
        { owner_id: owner_id },
        {
          $push: {
            plants: plantObj
          }
        },
        function(err, docs) {
          if (err) {
            res.status(500).send(err);
          } else {
            if (docs == null) {
              res.status(404).send("user not found");
            } else {
              res.status(201).send(plantObj);
            }
          }
        }
      );
    }
  }
});
// get plant
router.get("/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;

  plantCollection.findOne({ owner_id: owner_id }, (err, item) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if(item == null){
        res.status(404).send("owner not found");
      }else{
        res.status(200).send(item.plants);
      }
    }
  });
});

// edit a plant
router.put("/:plantid", (req, res, next) => {
  var plant_id = req.params.plantid;
  var name = req.body.name;
  var cover_image = req.body.cover_image;
  var updateObj = {};
  if (name != undefined && cover_image != undefined) {
    updateObj = {
      "plants.$[target].name": name,
      "plants.$[target].cover_image": cover_image
    };
  } else if (name != undefined) {
    updateObj = {
      "plants.$[target].name": name
    };
  } else if (cover_image != undefined) {
    updateObj = {
      "plants.$[target].cover_image": cover_image
    };
  }
  plantCollection.update(
    { "plants._id": plant_id },
    {
      $set: updateObj
    },
    { arrayFilters: [{ "target._id": plant_id }] },
    (err, docs) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if(docs.n == 0){
          res.status(404).send("plant not found");
        }else{
          res.status(200).send("updated");
        }
      }
    }
  );
});

//delete plant
router.delete("/:plantid", (req, res, next) => {
  var plant_id = req.params.plantid;
  operationCollection.findOne({ "logs.plant_id": plant_id }, (err, docs) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs != null) {
        res.status(400).send("plant in progress");
      } else {
        plantCollection.update(
          {
            "plants._id": plant_id
          },
          {
            $pull: {
              plants: { _id: plant_id }
            }
          },
          (err, docs) => {
            if (err) {
              res.status(500).send(err.message);
            } else {
              if (docs.n == 0) {
                res.status(400).send("something went wrong");
              } else {
                res.status(200).send("deleted");
              }
            }
          }
        );
      }
    }
  });
});

// new activity
router.post("/activity/:plantid", async (req, res) => {
  var plant_id = req.params.plantid;
  var owner_id = req.query.id;
  var _id = new mongoose.Types.ObjectId();
  var tasks = req.body.tasks;
  var duration = req.body.duration;
  var newActivity = { _id: _id, tasks: tasks, duration: duration };

  if (tasks == undefined || duration == undefined) {
    res.status(400).send("activity details must be specified");
  } else {
    plantCollection.update(
      { "plants._id": plant_id },
      {
        $push: {
          "plants.$[target].activities": newActivity
        }
      },
      {
        arrayFilters: [{ "target._id": plant_id }],
        multi: false
      },
      (err, docs) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs == null) {
            res.status(404).send("plant not found");
          } else {
            if (docs.n == 0 || docs.nModified == 0) {
              res.status(400).send("something went wrong");
            } else {
              res.status(201).send(newActivity);
            }
          }
        }
      }
    );
  }
});

//edit activity
router.put("/activity/:plantid", (req, res, next) => {
  var activity_id = req.query.activity;
  var plant_id = req.params.plantid;
  var tasks = req.body.tasks;
  var duration = parseInt(req.body.duration);

  plantCollection.findOne(
    { "plants._id": plant_id },
    { "plants.$": 1 },
    (err, plant) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (plant.plants[0].activities.length != 0) {
          editActivity(plant.plants[0]);
        } else {
          res.status(404).send("plant id not found");
        }
      }
    }
  );

  function editActivity(plant) {
    var activities = plant.activities;
    for (let i = 0; i < activities.length; i++) {
      if (activities[i]._id == activity_id) {
        var newActivity = {
          _id: activities[i]._id,
          tasks: tasks,
          duration: duration
        };
        activities[i] = newActivity;
      }
    }
    plant.activities = activities;

    plantCollection.update(
      { "plants._id": plant_id },
      {
        $set: {
          plants: plant
        }
      },
      (err, activities) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(200).send(plant);
        }
      }
    );
  }
});

//delete activity
router.delete("/activity/:plantid", (req, res, next) => {
  var activity_id = req.query.activity;
  var plant_id = req.params.plantid;

  plantCollection.update(
    { "plants._id": plant_id },
    {
      $pull: {
        "plants.activities": { _id: activity_id }
      }
    },
    (err, docs) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.n == 0 || docs.nModified == 0) {
          res.status(400).send("delete failed , something went wrong");
        } else {
          removeFromOperation();
        }
      }
    }
  );

  function removeFromOperation() {
    operationCollection.update(
      { "logs.plant_id": plant_id },
      {
        $pull: {
          "logs.activities": { _id: activity_id }
        }
      },
      (err, docs) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(200).send("deleted");
        }
      }
    );
  }
});

module.exports = router;
