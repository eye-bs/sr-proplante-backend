const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");
const reportCollection = require("../models/reportModels");

//login owner
router.post("/login", (req, res, next) => {
  var email = req.body.email;
  ownerCollection.findOne({ email: email }, function(err, docs) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs == "" || docs == null) {
        res.status(404).send({ message: "user not found" });
      } else {
        res.status(200).json(docs);
      }
    }
  });
});

// register owner
router.post("/register", (req, res, next) => {
  var email = req.body.email;
  var _id = new mongoose.Types.ObjectId();
  var manager_code = generateCode()
  var newOwner = new ownerCollection({
    _id: _id,
    email: email,
    name: req.body.name,
    manager_id: manager_code
  });
  var managerInfo = {
    _id: manager_code,
    name: req.body.name,
    active: false,
    image: "",
    contact_info: {
      address: "",
      phone: ""
    }
  };
  var managerData = new managerCollection({
    _id: new mongoose.Types.ObjectId(),
    owner_id: _id,
    managers: [managerInfo]
  });
  var landsData = new landCollection({
    _id: new mongoose.Types.ObjectId(),
    owner_id: _id,
    lands: []
  });
  var plantData = new plantCollection({
    _id: new mongoose.Types.ObjectId(),
    owner_id: _id,
    plants: []
  });

  ownerCollection.find({ email: email }, (err, docs) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (docs == "" || docs == null) {
        newOwner
          .save()
          .then(() => {
            managerData.save();
            landsData.save();
            plantData.save();
            cacheData.save();
          })
          .catch(err => {
            res.status(500).send(err.message);
          });

        res.status(201).send(newOwner);
      } else {
        res.status(400).send({ message: "email is exists" });
      }
    }
  });
});

//delete account
router.delete("/remove/:owner_id", (req, res, next) => {
  var owner_id = req.params.owner_id;
  landCollection.aggregate(
    [
      { $match: { owner_id: owner_id } },
      {
        $project: {
          _id: 0,
          land_id: "$lands._id"
        }
      },
      { $unwind: "$land_id" }
    ],
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        removeAccount(docs);
      }
    }
  );

  function removeAccount(landArr) {
    managerCollection.findOneAndDelete({ owner_id: owner_id }, (err, docs) => {
      if (!err) {
        plantCollection.findOneAndDelete(
          { owner_id: owner_id },
          (err, docs) => {
            if (!err) {
              landCollection.findOneAndDelete(
                { owner_id: owner_id },
                (err, docs) => {
                  if (!err) {
                    operationCollection.remove(
                      { land_id: { $or: landArr } },
                      (err, result) => {
                        if (!err) {
                          reportCollection.remove(
                            { land_id: { $or: landArr } },
                            (err, result) => {
                              if (!err) {
                                ownerCollection.findOneAndDelete(
                                  { owner_id: owner_id },
                                  (err, docs) => {
                                    if (!err) {
                                      res.status(200).send("success!!!!!!");
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    });
  }
});

function generateCode() {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = router;
