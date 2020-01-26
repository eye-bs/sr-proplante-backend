const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");
const reportCollection = require("../models/reportModels");

// show all lands
router.get("/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  landCollection.findOne({ owner_id: owner_id }, (err, lands) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (lands == null) {
        res.status(404).send("owner not found");
      } else {
        var queryLands = [];
        for (let i = 0; i < lands.lands.length; i++) {
          var obj = { land_id: lands.lands[i]._id };
          queryLands.push(obj);
        }
        getOperation(queryLands, lands.lands);
      }
    }
  });

  function getOperation(queryLands, lands) {
    operationCollection.find({ $or: queryLands }, (err, operations) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        var results = [];
        for (let i = 0; i < operations.length; i++) {
          var obj = {
            land: lands[i],
            operation: operations[i]
          };
          results.push(obj);
        }
        res.status(200).send(results);
      }
    });
  }

  // router.get("/:ownerid", (req, res, next) => {
  //   var owner_id = req.params.ownerid;
  //   var province = req.query.province || "all";
  //   var district = req.query.district || "all";
  //   var landname = req.query.landname || "all";
  //   var plant = req.query.plant || "all";
  //   var queryLands = [];

  //   var conditions = {};
  //   if (province != "all" && district != "all") {
  //     conditions = {
  //       $and: [
  //         { $eq: ["$$land.province", province] },
  //         { $eq: ["$$land.district", district] }
  //       ]
  //     };
  //   } else if (province != "all" && district == "all") {
  //     conditions = { $eq: ["$$land.province", province] };
  //   }
  //   if (landname != "all") {
  //     conditions = { $eq: ["$$land.name", landname] };
  //   }
  //   if (plant != "all") {
  //     queryLands = [];
  //   }

  //   landCollection
  //     .aggregate([
  //       { $match: { $and: [{ owner_id: owner_id }] } },
  //       {
  //         $project: {
  //           lands: {
  //             $filter: {
  //               input: "$lands",
  //               as: "land",
  //               cond: conditions
  //             }
  //           },
  //           _id: 0
  //         }
  //       }
  //     ])
  //     .exec()
  //     .then(docs => {
  //       if (docs[0].lands.length == 0) {
  //         res.status(400).send("data not found");
  //       } else {
  //         var resultData = docs;
  //         var landsDataArr = resultData[0].lands;
  //         for (let i = 0; i < landsDataArr.length; i++) {
  //           var landId = {
  //             land_id: landsDataArr[i]._id
  //           };
  //           queryLands.push(landId);
  //         }
  //         if (plant != "all") {
  //           queryPlant(resultData);
  //         } else {
  //           progressPerland(resultData);
  //         }
  //         // res.status(200).send(queryPlants);
  //       }
  //     })
  //     .catch(err => {
  //       res.json({ message: err.message });
  //     });

  //   function queryPlant(resultData) {
  //     operationCollection
  //       .aggregate([
  //         { $match: { $or: queryLands } },
  //         {
  //           $project: {
  //             land_id: "$land_id",
  //             logs: {
  //               $filter: {
  //                 input: "$logs",
  //                 as: "log",
  //                 cond: {
  //                   $and: [
  //                     { $eq: ["$$log.plant_name", plant] },
  //                     { $eq: ["$$log.real_product", null] }
  //                   ]
  //                 }
  //               }
  //             },
  //             _id: 0
  //           }
  //         }
  //       ])
  //       .exec()
  //       .then(docs => {
  //         if (docs == null) {
  //           res.status(400).send("data not found");
  //         } else {
  //           var landIdArr = [];
  //           for (let i = 0; i < docs.length; i++) {
  //             if (docs[i].logs.length != 0) {
  //               landIdArr.push(docs[i].land_id);
  //             }
  //           }
  //           var resultPlants = [];
  //           if (landIdArr.length != 0) {
  //             for (let i = 0; i < landIdArr.length; i++) {
  //               for (let j = 0; j < resultData[0].lands.length; j++) {
  //                 if (resultData[0].lands[j]._id == landIdArr[i]) {
  //                   resultPlants.push(resultData[0].lands[j]);
  //                 }
  //               }
  //             }
  //           } else {
  //             resultPlants = resultData;
  //           }
  //           var schemaLands = [{ lands: resultPlants }];
  //           progressPerland(schemaLands);
  //         }
  //       })
  //       .catch(err => {
  //         res.status(500).json({ message: err.message });
  //       });
  //   }

  //   function progressPerland(landsData) {
  //     var progressData = [];
  //     var landsDataArr = landsData[0].lands;

  //     operationCollection.find(
  //       {
  //         $or: queryLands
  //       },
  //       function(err, docs) {
  //         if (err) {
  //           res.status(500).send(err.message);
  //         } else {
  //           console.log(landsDataArr);
  //           if (docs != null) {
  //             var filterId = [];
  //             for (let i = 0; i < docs.length; i++) {
  //               for (let j = 0; j < landsDataArr.length; j++) {
  //                 if (docs[i].land_id == landsDataArr[j]._id) {
  //                   filterId.push(docs[i]);
  //                 }
  //               }
  //             }
  //             for (let i = 0; i < landsDataArr.length; i++) {
  //               var logs = filterId[i].logs;
  //               var activities =
  //                 logs.length == 0 ? [] : logs[logs.length - 1].activities || 0;
  //               var done = 0;
  //               for (let k = 0; k < activities.length; k++) {
  //                 if (activities[k].status == "เสร็จแล้ว") {
  //                   done++;
  //                 }
  //               }

  //               var data = {
  //                 land_id: landsDataArr[i]._id,
  //                 progress: (done / 100) * activities.length || 0,
  //                 plant_name:
  //                   logs.length == 0 ? null : logs[logs.length - 1].plant_name,
  //                 last_activity:
  //                   activities.length == 0
  //                     ? "ไม่มี"
  //                     : activities[activities.length - 1].tasks
  //               };
  //               progressData.push(data);
  //               if (i == landsDataArr.length - 1) {
  //                 var result = {
  //                   lands: landsData[0].lands,
  //                   progress: progressData
  //                 };
  //                 res.status(200).send(result);
  //               }
  //             }
  //           } else {
  //             res.status(404).send("data not found");
  //           }
  //         }
  //       }
  //     );
  //   }
  // });
});

// new land
router.post("/:ownerid", (req, res, next) => {
  var land_id = new mongoose.Types.ObjectId();
  var owner_id = req.params.ownerid;
  var land_name = req.body.name;
  var province = req.body.province;
  var district = req.body.district;
  var area = req.body.area;
  var points = req.body.points;

  var operationData = new operationCollection({
    _id: new mongoose.Types.ObjectId(),
    land_id: land_id
  });
  var reportData = new reportCollection({
    _id: new mongoose.Types.ObjectId(),
    land_id: land_id,
    logs: []
  });

  if (
    land_name == undefined ||
    province == undefined ||
    district == undefined ||
    area == undefined ||
    points == undefined
  ) {
    res.status(400).send("land detail must be specified");
  } else {
    var newLandObj = {
      _id: land_id,
      name: land_name,
      province: province,
      district: district,
      area: area,
      points: points
    };

    landCollection.findOne(
      {
        owner_id: owner_id,
        "lands.name": land_name
      },
      {
        "lands.$": 1
      },
      function(err, item) {
        if (item == null) {
          newLand();
        } else {
          res.status(400).send("this land is exists");
        }
      }
    );

    function newLand() {
      landCollection.findOneAndUpdate(
        {
          owner_id: owner_id
        },
        {
          $push: {
            lands: newLandObj
          }
        },
        function(err, docs) {
          if (err) {
            res.status(500).send(err);
          } else {
            if (docs == null) {
              res.status(404).send("user not found");
            } else {
              operationData.save();
              reportData.save();
              res.status(201).send(newLandObj);
            }
          }
        }
      );
    }
  }
});

//edit lands
router.put("/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  var land_name = req.body.name;
  var province = req.body.province;
  var district = req.body.district;
  var area = req.body.area;
  var points = req.body.points;
  if (
    land_name == undefined ||
    province == undefined ||
    district == undefined ||
    area == undefined ||
    points == undefined
  ) {
    res.status(400).send("land detail must be specified");
  } else {
    var newLandObj = {
      "lands.$[target].name": land_name,
      "lands.$[target].province": province,
      "lands.$[target].district": district,
      "lands.$[target].area": area,
      "lands.$[target].points": points
    };

    landCollection
      .update(
        {
          "lands._id": land_id
        },
        newLandObj,
        {
          arrayFilters: [{ "target._id": land_id }],
          multi: false
        }
      )
      .exec()
      .then(docs => {
        if (docs.n == 0 || docs.nModified == 0) {
          res.status(400).send("something went wrong");
        } else {
          res.status(200).send("edit land successfully");
        }
      })
      .catch(err => {
        res.status(500).json({ message: err.message });
      });
  }
});

// get filter land
router.get("/filter/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  landCollection.aggregate(
    [
      { $match: { $and: [{ owner_id: owner_id }] } },
      {
        $project: {
          lands: "$lands"
        }
      }
    ],
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs == "" || docs == null) {
          res.status(404).send("lands not found");
        } else {
          var lands = docs[0].lands;
          var mapAddress = {};
          var nameArr = [];
          var idArr = [];
          var addressArr = [];

          for (let i = 0; i < lands.length; i++) {
            var district = mapAddress[lands[i].province];
            nameArr.push(lands[i].name);
            idArr.push(lands[i]._id);
            if (mapAddress[lands[i].province] == null) {
              mapAddress[lands[i].province] = [lands[i].district];
            } else {
              if (district.includes(lands[i].district)) {
                continue;
              }
              district.push(lands[i].district);
              mapAddress[lands[i].province] = district;
            }
          }

          var keys = Object.keys(mapAddress);

          for (let i = 0; i < keys.length; i++) {
            var address = {
              province: keys[i],
              district: mapAddress[keys[i]]
            };
            addressArr.push(address);
          }
          var landFilter = {
            land_id: idArr,
            land_name: nameArr,
            address: addressArr
          };
          filterPlantName(landFilter);
        }
      }
    }
  );
  function filterPlantName(landQuery) {
    var landId = landQuery.land_id;
    landIdArr = [];
    for (let i = 0; i < landId.length; i++) {
      var landObj = {
        land_id: landId[i]
      };
      landIdArr.push(landObj);
    }

    operationCollection
      .aggregate([
        {
          $match: { $or: landIdArr }
        },
        {
          $project: {
            _id: "$logs.plant_id"
          }
        }
        // ,
        // {
        //   $project: {
        //     plant: {
        //       $cond: {
        //         if: { $eq: [[], "$plant"] },
        //         then: "$$REMOVE",
        //         else: "$plant.plant_name"
        //       }
        //     },
        //     _id: 0
        //   }
        // }
      ])
      .exec()
      .then(docs => {
        if (docs == "" || docs == null) {
          res.status(404).send("lands not found");
        } else {
          var plantArr = [];
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]._id == undefined) {
              continue;
            }
            plantArr.push({ "plants._id": docs[i]._id });
          }
          var plantObj = { plant: plantArr };
          getPlantName(plantArr, landQuery);
        }
      })
      .catch(err => {
        res.status(500).json({ message: err.message });
      });
  }

  function getPlantName(plantArr, landQuery) {
    plantCollection.aggregate(
      [
        { $match: { $or: plantArr } },
        {
          $project: {
            _id: 0,
            name: "$plants.name"
          }
        }
      ],
      (err, plants) => {
        var plantName = {
          plant: plants[0].name
        };
        var newFilter = Object.assign({}, landQuery, plantName);
        res.status(200).send(newFilter);
      }
    );
  }
});

//delete land
router.delete("/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  landCollection.update(
    {
      "lands._id": land_id
    },
    {
      $pull: {
        lands: { _id: land_id }
      }
    },
    (err, data) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        operationCollection.findOneAndDelete(
          { land_id: land_id },
          (err, data) => {
            if (err) {
              res.status(500).send(err.message);
            } else {
              reportCollection.findOneAndDelete(
                { land_id: land_id },
                (err, data) => {
                  if (err) {
                    res.status(500).send(err.message);
                  } else {
                    res.status(200).send("deleted");
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

//----------------------------

//get old data land
router.get("/edit/:landid", (req, res, next) => {
  land_id = req.params.landid;
  landCollection.find(
    { "lands._id": land_id },
    {
      "lands.$": 1
    },
    function(err, item) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (item == null || item.length == 0) {
          res.status(404).send("land not found");
        } else {
          res.status(200).send(item);
        }
      }
    }
  );
});

//land detail
router.get("/detail/:landid", (req, res, next) => {
  land_id = req.params.landid;
  operationCollection.find(
    { land_id: land_id },
    { logs: { $slice: -1 } },
    function(err, item) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (item == null || item.length == 0) {
          res.status(404).send("land not found");
        } else {
          if (item[0].logs.length != 0) {
            landCollection.find(
              { "lands._id": land_id },
              {
                "lands.$": 1
              },
              function(err, land) {
                if (err) {
                  res.status(500).send(err.message);
                } else {
                  if (item == null || item.length == 0) {
                    res.status(404).send("land not found");
                  } else {
                    var result = {
                      land_id: item[0].land_id,
                      land_name: land[0].lands[0].name,
                      logs: item[0].logs
                    };

                    if (item[0].logs.activities.length != 0) {
                      res.status(200).send(result);
                    } else {
                      res.status(404).send("no oeration cycle available");
                    }
                  }
                }
              }
            );
          } else {
            res.status(404).send("no oeration cycle available");
          }
        }
      }
    }
  );
});

//land names
router.get("/name/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  var inProgress = req.query.inprogress || false;
  if (inProgress) {
    // landCollection.aggregate(
    //   [
    //     { $match: { owner_id: owner_id } },
    //     {
    //       $project: {
    //         _id: 0,
    //         query_id: {
    //           land_id: "$lands._id"
    //         },
    //         land_name: "$lands.name",
    //         land_id : "$lands._id"
    //       }
    //     },
    //     { $unwind: "$query_id.land_id" },
    //     {
    //       $group: {
    //         _id: 0,
    //         query_id: { $push: "$query_id" },
    //         land_name: { $first: "$land_name" },
    //         land_id : {$first: "$land_id"}
    //       }
    //     }
    //   ],
    //   function(err, docs) {
    //     if (err) {
    //       res.status(500).send(err.message);
    //     } else {
    operationCollection.find({}, function(err, docs2) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        var landIdCycle = [];
        for (let i = 0; i < docs2.length; i++) {
          if (docs2[i].logs.plant_name == undefined) {
            docs2.splice(i, 1);
          } else {
            landIdCycle.push({ "lands._id": docs2[i].land_id });
          }
        }

        landCollection.aggregate(
          [
            { $match: { owner_id: owner_id } },
            {
              $project: {
                lands: "$lands"
              }
            },
            { $unwind: "$lands" },
            { $match: { $or: landIdCycle } },
            {
              $group: {
                _id: 0,
                land_name: { $push: "$lands.name" }
              }
            }
          ],
          function(err, docs) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.status(200).send(docs[0]);
            }
          }
        );
      }
    });
  } else {
    landCollection.aggregate(
      [
        { $match: { owner_id: owner_id } },
        {
          $project: {
            land_name: "$lands.name",
            _id: 0
          }
        }
      ],
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(200).send(docs[0]);
        }
      }
    );
  }
});

module.exports = router;
