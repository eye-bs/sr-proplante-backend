const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");

//get all activities

router.get("/:ownerId", (req, res, next) => {
  var owner_id = req.params.ownerId;
  var byDate = req.query.byDate || false;
  var byLands = req.query.byLands || false;

  landCollection.aggregate(
    [
      { $match: { owner_id: owner_id } },
      { $unwind: "$lands" },
      {
        $project: {
          _id: 0,
          land_id: "$lands._id",
          name: "$lands.name"
        }
      },
      {
        $group: {
          _id: 0,
          q: { $push: { land_id: "$land_id" } },
          data: { $push: { land_id: "$land_id", name: "$name" } }
        }
      }
    ],
    function(err, docs) {
      if (err) {
        res.status(500).send(err);
      } else {
        if (docs.length == 0) {
          res.status(404).send("owner not found / land not found");
        } else {
          getActivities(docs[0]);
          // res.status(200).send(docs[0]);
        }
        //
      }
    }
  );
  function getActivities(docs) {
    operationCollection.aggregate(
      [
        { $match: { $or: docs.q } },
        {
          $project: {
            _id: "$land_id",
            start_date: "$logs.start_date",
            plant_id: "$logs.plant_id",
            activities: "$logs.activities"
          }
        }
      ],
      (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          if (data.length == 0) {
            res.status(404).send("owner not found / land not found");
          } else {
            queryByDate(data, docs);
          }
          // res.status(200).send(docs);
        }
      }
    );
  }
  function queryByDate(op, lands) {
    var activities = [];
    var newLandArr = {};
    for (let i = 0; i < op.length; i++) {
      var ac_op = op[i].activities;
      newLandArr[lands.data[i].land_id] = lands.data[i].name;
      Array.prototype.push.apply(activities, ac_op);
    }

    plantCollection.aggregate(
      [
        { $match: { owner_id: owner_id } },
        {
          $project: {
            _id: "$plants.name",
            plants_id: "$plants._id",
            activities: "$plants.activities"
          }
        }
      ],
      (err, results) => {
        if (err) {
          res.status(500).send(err);
        } else {
          if (results.length == 0) {
            res.status(404).send("owner not found / land not found");
          } else {

            var plantAc = [];
            var acti = results[0].activities;
            for (let i = 0; i < acti.length; i++) {
              var activities = acti[i];
              for (let j = 0; j < activities.length; j++) {
                var activity = activities[j];
                var plant_name = {
                  plant_name: results[0]._id[i],
                  plant_id: results[0].plants_id[i]
                };
                var obj = Object.assign({}, activity, plant_name);
                plantAc.push(obj);
              }
            }
            setResult(newLandArr, op, plantAc);
          }
        }
      }
    );
  }

  function setResult(lands, op, plants) {
    var response = [];
    op.forEach(operation =>{
      var activities = operation.activities;
      var plant_id = operation.plant_id;
      activities.forEach(activity =>{
        var object;
        var plant = plants.find(x => x._id == activity._id) || plants.find(x => x.plant_id == plant_id);
        var simpleStartDate = computeDurationDate(operation.start_date , plant.duration);
        object = {
          land_name: lands[operation._id],
          land_id: operation._id,
          activity_id: activity._id,
          start_date: activity.activity_type == "emergency" ? activity.end_date : simpleStartDate,
          end_date: activity.end_date,
          plant_name: plant.plant_name,
          task: activity.task || plant.tasks,
          status: activity.status,
          images: activity.images,
          manager_id: activity.manager_id,
          notes: activity.notes
        };
        response.push(object);
      })
    })
      if (byLands) {
          response.sort(dynamicSort("land_name"));
        } else {
          response.sort(dynamicSort("start_date"));
        }
        res.status(200).send(response);

  }
});

function computeDurationDate(start_date , duration){
  var st_date = new Date(start_date);
        var duration = duration * 7 - 7;
        st_date.setDate(st_date.getDate() + duration);
        var activityDate = getMonday(st_date);
        var tzo = -activityDate.getTimezoneOffset() / 60;
        tzo = (tzo + "").padStart(2, "0");
        activityDate = new Date(
          activityDate.getTime() - activityDate.getTimezoneOffset() * 60000
        );
        var tsp = activityDate.toISOString();
        tsp = tsp.replace("Z", `+${tzo}:00`);

        return tsp
}

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}
function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function(a, b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

// Create emerrgency activity
router.post("/emergency/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var status = req.body.status;
  var end_date = req.body.end_date;
  var notes = req.body.notes;
  var images = req.body.images;
  var manager_id = req.body.manager_id;
  var task = req.body.task;
  var end_date = req.body.end_date;
  if (
    status == undefined ||
    end_date == undefined ||
    notes == undefined ||
    images == undefined ||
    manager_id == undefined ||
    task == undefined
  ) {
    res.status(400).send("activity details must be specified");
  } else {
    var activityModel = {
      _id: new mongoose.Types.ObjectId(),
      task: task,
      status: status,
      activity_type: "emergency",
      end_date: end_date,
      notes: notes,
      images: images,
      manager_id: manager_id
    };

    operationCollection.update(
      { land_id: land_id },
      {
        $push: {
          "logs.activities": activityModel
        }
      },
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs.n == 0) {
            res.status(400).send("something went wrong");
          } else {
            res.status(200).send("created");
          }
        }
      }
    );
  }
});

//activity details
router.get("/detail/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var activity_id = req.query.activity;
  operationCollection.aggregate(
    [
      { $match: { land_id: land_id } },
      {
        $project: {
          activities: "$logs.activities"
        }
      },
      { $unwind: "$activities" },
      { $match: { "activities._id": activity_id } }
    ],
    function(err, docs) {
      console.log("docs", docs);
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.length == 0) {
          res.status(404).send("land or activity not found");
        } else {
          if (
            docs[0].activities.manager_id != null ||
            docs[0].activities.manager_id != undefined
          ) {
            managerCollection.aggregate(
              [
                {
                  $match: { "managers._id": docs[0].activities.manager_id }
                },
                {
                  $project: {
                    manager: {
                      $filter: {
                        input: "$managers",
                        as: "managers",
                        cond: {
                          $eq: ["$$managers._id", docs[0].activities.manager_id]
                        }
                      }
                    }
                  }
                }
              ],
              (err, data) => {
                if (err) {
                  res.status(500).send(err);
                } else {
                  docs[0].activities.manager_id = data[0].manager[0].name;
                  res.status(200).send(docs[0]);
                }
              }
            );
          } else {
            res.status(200).send(docs[0]);
          }

          //getLandName(docs[0]);
        }
      }
    }
  );

  function getLandName(activity) {
    landCollection.find(
      { "lands._id": land_id },
      {
        "lands.$": 1
      },
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          var landName = { land_name: docs[0].lands[0].name };
          var activivtyDetail = Object.assign({}, landName, activity);
          res.status(200).send(activivtyDetail);
        }
      }
    );
  }
});

router.put("/overdue/:landid", (req, res) => {
  var activity_id = req.query.activity;
  var land_id = req.params.landid;
  operationCollection.update(
    { land_id: land_id, "logs.activities._id": activity_id },
    {
      $set: { "logs.activities.$[target].status": "เลยกำหนด" }
    },
    {
      multi: false,
      arrayFilters: [{ "target._id": activity_id }]
    },
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.n == 0) {
          res.status(400).send("something went wrong.");
        } else {
          res.status(200).send("updated");
        }
      }
    }
  );
});

//update progress
router.post("/:landid", (req, res, next) => {
  var activity_id = req.query.activity;
  var land_id = req.params.landid;

  var status = req.body.status;
  var end_date = req.body.end_date;
  var notes = req.body.notes;
  var images = req.body.images;
  var manager_id = req.body.manager_id;
  if (
    status == undefined ||
    end_date == undefined ||
    notes == undefined ||
    images == undefined ||
    manager_id == undefined
  ) {
    res.status(400).send("activity details must be specified");
  } else {
    var activityProgress = {
      "logs.activities.$[target].status": status,
      "logs.activities.$[target].end_date": end_date,
      "logs.activities.$[target].notes": notes,
      "logs.activities.$[target].images": images,
      "logs.activities.$[target].manager_id": manager_id
    };

    operationCollection.update(
      { land_id: land_id, "logs.activities._id": activity_id },
      {
        $set: activityProgress
      },
      {
        multi: false,
        arrayFilters: [{ "target._id": activity_id }]
      },
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs.n == 0) {
            res.status(400).send("something went wrong.");
          } else {
            res.status(200).send("updated");
          }
        }
      }
    );
  }

});

//remove op cycle activity
router.delete("/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var activity_id = req.query.activity;

  operationCollection.update(
    { land_id: land_id },
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
});
module.exports = router;
