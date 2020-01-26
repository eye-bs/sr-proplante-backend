const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");
const reportCollection = require("../models/reportModels");

router.get("/:landid", (req, res, next) => {
  var land_id = req.params.landid;
  reportCollection.find({ land_id: land_id }, function(err, docs) {
    docs = docs[0];
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs == null) {
        res.status(400).send("something went wrong");
      } else {
        res.status(200).send(docs);
      }
    }
  });
});

router.get("/detail/:landid", (req, res, next) =>{
  var land_id = req.params.landid;
  var report_id = req.query.report;
  reportCollection.find(
    { $and:[{land_id: land_id} , {"logs._id": report_id}] },
    {
      "logs.$": 1
    }, 
    function(err, docs) {
    docs = docs[0];
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs == null) {
        res.status(400).send("something went wrong");
      } else {
        res.status(200).send(docs);
      }
    }
  });
})

module.exports = router;
