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

  if (name == undefined) {
    res.status(400).send("plant details must be specified");
  } else {
    var plantObj = {
      _id: plant_id,
      name: name,
      cover_image: cover_image,
      activities: []
    };

    plantCollection.findOne({
        owner_id: owner_id,
        "plants.name": name
      }, {
        "plants.$": 1
      },
      function (err, item) {
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
      plantCollection.findOneAndUpdate({
          owner_id: owner_id
        }, {
          $push: {
            plants: plantObj
          }
        },
        function (err, docs) {
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

  plantCollection.findOne({
    owner_id: owner_id
  }, (err, item) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (item == null) {
        res.status(404).send("owner not found");
      } else {
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
  plantCollection.update({
      "plants._id": plant_id
    }, {
      $set: updateObj
    }, {
      arrayFilters: [{
        "target._id": plant_id
      }]
    },
    (err, docs) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.n == 0) {
          res.status(404).send("plant not found");
        } else {
          res.status(200).send("updated");
        }
      }
    }
  );
});

//delete plant
router.delete("/:plantid", (req, res, next) => {
  var plant_id = req.params.plantid;
  operationCollection.findOne({
    "logs.plant_id": plant_id
  }, (err, docs) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs != null) {
        res.status(400).send("plant in progress");
      } else {
        plantCollection.update({
            "plants._id": plant_id
          }, {
            $pull: {
              plants: {
                _id: plant_id
              }
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
  var _id = new mongoose.Types.ObjectId();
  var tasks = req.body.tasks;
  var duration = req.body.duration;
  var start_date = parseInt(req.body.start_date);
  var num_of_date = parseInt(req.body.num_of_date)
  var repeat = req.body.repeat
  var repeat_in = parseInt(req.body.repeat_in)
  var newActivity = {
    _id: _id,
    tasks: tasks,
    duration: duration,
    start_date: start_date,
    repeat: repeat,
    repeat_in: repeat_in,
    num_of_date: num_of_date
  };

  if (tasks == undefined || duration == undefined || repeat == undefined) {
    res.status(400).send("activity details must be specified");
  } else {
    plantCollection.update({
        "plants._id": plant_id
      }, {
        $push: {
          "plants.$[target].activities": newActivity
        }
      }, {
        arrayFilters: [{
          "target._id": plant_id
        }],
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
              operationUpdate()
            }
          }
        }
      }
    );
  }

  function operationUpdate() {
    operationCollection.find({
      "logs.plant_id": plant_id
    }, (err, operations) => {
      if (err) return res.status(500).send(err);
      var landsOperation = {}
      var findLand = [];
      operations.forEach((op) => {
        findLand.push({
          land_id: op.land_id
        })
        landsOperation[op.land_id] = op;

      })

      updateOperationsActivity(landsOperation)

    })


    function updateOperationsActivity(landsOperation) {

      var indexKey = Object.keys(landsOperation);

      indexKey.forEach((land_id,index) => {

        var logs = landsOperation[land_id].logs
        var opStart = new Date(logs.start_date);
        var opEnd = new Date(logs.end_date)
        var activityStart = new Date(logs.start_date)
        activityStart.setDate(opStart.getDate() + start_date);
        if (repeat) {
          while (activityStart < opEnd) {

            var activityEnd = new Date(activityStart.toISOString())
            activityEnd.setDate(activityEnd.getDate() + num_of_date);

            var activityObj = {
              _id: new mongoose.Types.ObjectId(),
              images: [],
              task: tasks,
              activity_id: _id,
              status: "ยังไม่ทำ",
              activity_type: "normal",
              start_date: activityStart.toISOString(),
              end_date: activityEnd.toISOString(),
              notes: null,
              manager_id: null
            }

            landsOperation[land_id].logs.activities.push(activityObj)
            activityStart.setDate(activityEnd.getDate() + repeat_in)

          }
        } else {
          var activityEnd = new Date(activityStart.toISOString())
          activityEnd.setDate(activityEnd.getDate() + num_of_date);

          var activityObj = {
            _id: new mongoose.Types.ObjectId(),
            images: [],
            task: tasks,
            activity_id: _id,
            status: "ยังไม่ทำ",
            activity_type: "normal",
            start_date: activityStart.toISOString(),
            end_date: activityEnd.toISOString(),
            notes: null,
            manager_id: null
          }

          landsOperation[land_id].logs.activities.push(activityObj)
        }
        operationCollection.update({
          "land_id": land_id
        }, {
          $set: {
            "logs.activities": landsOperation[land_id].logs.activities
          }
        }, (err, data) => {
          if (err) {
            res.status(500).send(err.message);
          } else {
            console.log("data", data);
            if(index == indexKey.length - 1){
              res.status(200).send("activity Created")
            }
          }
        })
      })
    }

  }
});

//edit activity
router.put("/activity/:plantid", (req, res, next) => {
  var activity_id = req.query.activity;
  var plant_id = req.params.plantid;
  var tasks = req.body.tasks;
  var duration = parseInt(req.body.duration);
  plantCollection.update({
      "plants._id": plant_id
    }, {
      $set: {
        "plants.$[ptarget].activities.$[target].tasks": tasks,
        "plants.$[ptarget].activities.$[target].duration": duration
      }
    }, {
      multi: false,
      arrayFilters: [{
        "target._id": activity_id
      }, {
        "ptarget._id": plant_id
      }]
    },
    (err, activities) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        console.log(activities)
        if (activities.n == 1) {
          res.status(200).send("edited");
        } else {
          res.send(400).send(activities)
        }
      }
    }
  );

  // plantCollection.findOne(
  //   { "plants._id": plant_id },
  //   { "plants.$": 1 },
  //   (err, plant) => {
  //     if (err) {
  //       res.status(500).send(err.message);
  //     } else {
  //       if (plant.plants[0].activities.length != 0) {
  //         editActivity(plant.plants[0]);
  //       } else {
  //         res.status(404).send("plant id not found");
  //       }
  //     }
  //   }
  // );

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
    var newActivity = {
      _id: activity_id,
      tasks: tasks,
      duration: duration
    };
    plant.activities = activities;
    // { land_id: land_id, "logs.activities._id": activity_id },
    // {
    //   $set: { "logs.activities.$[target].status": "เลยกำหนด" }
    // },
    plantCollection.update({
        "plants._id": plant_id
      }, {
        $set: {
          "plants.$[target]": newActivity
        }
      }, {
        multi: false,
        arrayFilters: [{
          "target._id": activity_id
        }]
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

  plantCollection.update({
      "plants._id": plant_id
    }, {
      $pull: {
        "plants.$[target].activities": {
          _id: activity_id
        }
      }
    }, {
      multi: false,
      arrayFilters: [{
        "target._id": plant_id
      }]
    },
    (err, docs) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        console.log("docs")
        if (docs.n == 0 || docs.nModified == 0) {
          res.status(400).send("delete failed , something went wrong");
        } else {
          removeFromOperation();
        }
      }
    }
  );

  function removeFromOperation() {
    operationCollection.update({
        "logs.plant_id": plant_id
      }, {
        $pull: {
          // logs:{activities:{$elemMatch:{_id:activity_id}}}
          "logs.activities": {
            activity_id: activity_id
          }
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