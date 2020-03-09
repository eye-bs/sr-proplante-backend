const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");
const reportCollection = require("../models/reportModels");

// start new cycle
router.post("/start/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var owner_id = req.query.id;

  var plantId = req.body.plant;
  var start_date = req.body.start_date;
  var end_date = req.body.end_date;
  var expected = req.body.expected_product;
  var _id = new mongoose.Types.ObjectId();


  if (
    plantId == undefined ||
    start_date == undefined ||
    expected == undefined
  ) {
    res.status(400).send("cycle details must be specified");
  } else {
    var operationObj = {
      plant_id: plantId,
      start_date: start_date,
      end_date: end_date,
      expected_product: expected,
      real_product: null,
      performance: null,
      activities: []
    };

    plantCollection
      .aggregate([{
          $match: {
            owner_id: owner_id,
            "plants._id": plantId
          }
        },
        {
          $project: {
            activities: {
              $filter: {
                input: "$plants",
                as: "plant",
                cond: {
                  $eq: ["$$plant._id", plantId]
                }
              }
            },
            _id: 0
          }
        }
      ])
      .exec()
      .then(docs => {
        var numOfActivity = docs[0].activities[0].activities;
        if (numOfActivity.length != 0) {
          var objActivity = setActivityDetail(operationObj, numOfActivity);
          operationObj.activities = objActivity;
          //res.send(objActivity)
          startCycle();
        } else {
          res.status(400).send("activity is null");
        }
      })
      .catch(err => {
        res.status(500).json({
          message: err.message
        });
      });

    function startCycle() {
      operationCollection.find({
          land_id: land_id
        },

        function (err, item) {
          if (err) {
            res.status(500).send(err.message);
          } else {
            if (item == null || item.length == 0) {
              console.log("start cy");
              res.status(404).send("land not found");
            } else {
              if (item[0].logs.activities.length != 0) {
                res
                  .status(400)
                  .send("can not start new cycle because it is exists");
              } else {
                operationCollection
                  .findOneAndUpdate({
                    land_id: land_id
                  }, {
                    $set: {
                      logs: operationObj
                    }
                  })
                  .exec()
                  .then(docs => {
                    if (docs == null) {
                      console.log("start cy");
                      res.status(404).send("land not found");
                    } else {
                      res.status(201).send(operationObj);
                      // res.status(201).send("new cycle start");
                    }
                  })
                  .catch(err => {
                    res.status(500).send(err);
                  });
              }
            }
          }
        }
      );
    }
  }
});

function setActivityDetail(cycle, plant) {
  var activities = [];
  var start_cy = new Date(cycle.start_date);
  var end_cy = new Date(cycle.end_date);
  plant.forEach(pl => {
    var ac_startdate = new Date(start_cy.toISOString())
    ac_startdate.setDate(ac_startdate.getDate() + pl.start_date);
    var ac_enddate = new Date(ac_startdate.toISOString())
    ac_enddate.setDate(ac_enddate.getDate() + pl.num_of_date - 1);
    if (pl.repeat) {
      while (ac_enddate < end_cy) {
        var obj = {
          _id: new mongoose.Types.ObjectId(),
          activity_id: pl._id,
          task: pl.tasks,
          status: "ยังไม่ทำ",
          activity_type: "normal",
          start_date: ac_startdate.toISOString(),
          end_date: ac_enddate.toISOString(),
          notes: null,
          images: [],
          manager_id: null
        };
        activities.push(obj);
        ac_startdate.setDate(ac_startdate.getDate() + pl.repeat_in)
        ac_enddate = new Date(ac_startdate.toISOString())
        ac_enddate.setDate(ac_enddate.getDate() + pl.num_of_date - 1)
      }
    } else {
      var obj = {
        _id: new mongoose.Types.ObjectId(),
        activity_id: pl._id,
        task: pl.tasks,
        status: "ยังไม่ทำ",
        activity_type: "normal",
        start_date: ac_startdate.toISOString(),
        end_date: ac_enddate.toISOString(),
        notes: null,
        images: [],
        manager_id: null
      };
      activities.push(obj);
    }
  })
  activities.sort(dynamicSort("start_date"));
  return activities

}

// harvested
router.post("/harvested/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var end_date = req.body.end_date;
  var real_product = req.body.real_product;
  var harvestedData = {
    "logs.end_date": end_date,
    "logs.real_product": real_product
  };

  if (end_date == undefined || real_product == undefined) {
    res.status(400).send("end_date or real_product must be specified");
  } else {
    operationCollection.findOneAndUpdate({
        land_id: land_id
      },
      harvestedData,
      function (err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs == null) {
            console.log("harvest");
            res.status(404).send("land not found");
          } else {
            docs.logs.end_date = end_date;
            docs.logs.real_product = real_product;
            docs.logs.performance =
              (real_product * 100) / docs.logs.expected_product;
            // sendReport(docs);
            setPlantName(docs);
          }
        }
      }
    );

    function setPlantName(docs) {
      var logs = docs.logs;
      var activities = logs.activities;
      var plant_id = logs.plant_id;
      plantCollection.findOne({
          "plants._id": plant_id
        }, {
          "plants.$": 1
        },
        (err, plant) => {
          if (err) {
            res.status(500).send(err.message);
          } else {
            console.log(plant)
            var plantName = {
              plant_name: plant.plants[0].name
            };
            var newFilter = Object.assign({}, plantName, logs);
            for (i in activities) {
              for (j in plant.plants[0].activities) {
                var plantAc = plant.plants[0].activities[j];
                if (plantAc._id == activities[i]._id) {
                  var task = {
                    task: plantAc.tasks
                  };
                  var activity = activities[i];

                  var duration = plantAc.duration * 7 - 7;
                  var startCycle = new Date(logs.start_date);
                  startCycle.setDate(startCycle.getDate() + duration);
                  var activityDate = getMonday(startCycle);

                  var tzo = -activityDate.getTimezoneOffset() / 60;
                  tzo = (tzo + "").padStart(2, "0");
                  activityDate = new Date(
                    activityDate.getTime() -
                    activityDate.getTimezoneOffset() * 60000
                  );
                  var tsp = activityDate.toISOString();
                  tsp = tsp.replace("Z", `+${tzo}:00`);
                  var newActivity = {
                    _id: activity._id,
                    task: plantAc.tasks,
                    status: activity.status,
                    activity_type: activity.activity_type,
                    start_date: tsp,
                    end_date: activity.end_date,
                    notes: activity.notes,
                    images: activity.images,
                    manager_id: activity.manager_id
                  };
                  activities[i] = newActivity;
                  break;
                }
              }
            }
            logs.activities = activities;
            newFilter.activities.sort(dynamicSort("end_date"));
            sendReport(newFilter)
          }
        }
      );
    }

    function sendReport(logs) {
      reportCollection.update({
          land_id: land_id
        }, {
          $push: {
            logs: logs
          }
        },
        function (err, docs) {
          if (err) {
            res.status(500).send(err.message);
          } else {
            operationCollection.update({
                land_id: land_id
              }, {
                $set: {
                  logs: {
                    activities: []
                  }
                }
              },
              function (err, docs) {
                if (err) {
                  res.status(500).send(err.message);
                } else {
                  if (docs.n == 0) {
                    res.status(400).send("something went wrong");
                  } else {
                    res.status(200).send("harvested");
                  }
                }
              }
            );
          }
        }
      );
    }
  }
});

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

router.post("/percent", (req, res) => {
  var land_id = req.body.qland;
  operationCollection.aggregate(
    [{
      $match: {
        $or: land_id
      }
    }],
    (err, result) => {
      var done = 0;
      var total = 0;
      var response = [];
      for (let i = 0; i < result.length; i++) {
        done = 0;
        var activities = result[i].logs.activities || undefined;
        if (activities == undefined) {
          var obj = {
            land_id: land_id[i].land_id,
            percent: 0
          };
          response.push(obj);
          continue;
        }
        total = activities.length;
        for (let j = 0; j < activities.length; j++) {
          var activity = activities[j];
          if (activity.status == "เสร็จแล้ว") {
            done++;
          }
        }
        var obj = {
          land_id: result[i].land_id,
          percent: (done * 100) / total | 0
        };
        response.push(obj);
      }
      res.status(200).send(response);
    }
  );
});

//get operation cycle
router.get("/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  operationCollection.findOne({
      land_id: land_id
    },
    function (err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs == null) {
          console.log("get id");
          res.status(404).send("land not found");
        } else {
          res.status(200).send(docs);
        }
      }
    }
  );
});

module.exports = router;