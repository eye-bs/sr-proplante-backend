const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ownerCollection = require("../models/ownersModels");
const managerCollection = require("../models/managersModels");
const landCollection = require("../models/landsModels");
const plantCollection = require("../models/plantsModels");
const operationCollection = require("../models/operationCycleModels");

//new manager code
router.post("/new/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  var newCode = generateCode();
  var contactObj = { address: "", phone: "" };
  var managerObj = {
    _id: newCode,
    name: "",
    image: "",
    active: false,
    contact_info: contactObj
  };
  managerCollection.update(
    { owner_id: owner_id },
    {
      $push: {
        managers: managerObj
      }
    },
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.n == 0) {
          res.status(400).send("something went wrong");
        } else {
          res.status(200).send({ manager_code: managerObj._id });
        }
      }
    }
  );
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

//login manager
router.post("/login", (req, res, next) => {
  var managerId = req.body.id;
  if (managerId.length == 8) {
    managerCollection.find(
      { "managers._id": managerId },
      { owner_id: 1, "managers.$": 1 },
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs.length == 0) {
            res.status(404).send("manager code not found");
          } else {
            docs = docs[0];
            if (docs.managers[0].name == "") {
              res.status(200).send({ first_login: true });
            } else {
              var data = docs.managers[0];
              res.status(200).send([
                {
                  owner_id: docs.owner_id,
                  first_login: false,
                  manager: data
                }
              ]);
            }
          }
        }
      }
    );
  } else if (managerId.length == 10) {
    managerCollection.find(
      { "managers.contact_info.phone": managerId },
      { owner_id: 1, "managers.$": 1 },
      function(err, docs) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          if (docs.length == 0) {
            res.status(404).send("phone number not registered");
          } else {
            var result = [];
            for (let i = 0; i < docs.length; i++) {
              var obj = {
                owner_id: docs[i].owner_id,
                first_login: docs[i].managers[0].name == "" ? true : false,
                manager: docs[i].managers[0]
              };
              result.push(obj);
            }
            res.status(200).send(result);
          }
        }
      }
    );
  } else {
    res.status(404).send("user not found");
  }
});

//register managers
router.post("/register/:managerid", (req, res, next) => {
  var managerId = req.params.managerid;
  var name = req.body.name;
  var image = req.body.image;
  var contact_info = req.body.contact_info;

  if (name == undefined || image == undefined || contact_info == undefined) {
    res.status(400).send("manager details must be specified");
  } else {
    var managerInfo = {
      _id: managerId,
      name: name,
      active: true,
      image: image,
      contact_info: contact_info
    };

    managerCollection.findOne({ "managers._id": managerId }, (err, result) => {
      if (err) {
        res.send(err);
      } else {
        if (result == null) {
          res.status(404).send("user not found");
        } else {
          var managers = result.managers;
          var newMembers = true;
          for (i in managers) {
            if (managers[i].contact_info.phone == contact_info.phone) {
              res.status(400).send("already registered");
              newMembers = false;
              break;
            }
            if (managers[i]._id == managerId && managers[i].name != "") {
              res.status(400).send("already registered");
              newMembers = false;
              break;
            }
          }
          if (newMembers) {
            managerCollection.update(
              { "managers._id": managerId },
              {
                $set: {
                  "managers.$[target]": managerInfo
                }
              },
              {
                multi: false,
                arrayFilters: [{ "target._id": managerId }]
              },
              function(err, docs) {
                if (err) {
                  res.status(500).send(err.message);
                } else {
                  if (docs == null) {
                    res.status(404).send("user not found");
                  } else {
                    res.status(201).send("registered");
                  }
                }
              }
            );
          }else{
            res.status(404).send("Something went wrong");
          }
        }

        // if (result.length != 0) {
        // res.status(400).send("already registered");
        // } else {
        // managerCollection.findOneAndUpdate(
        //   { "managers._id": managerId },
        //   {
        //     $set: {
        //       "managers.$[target]": managerInfo
        //     }
        //   },
        //   {
        //     multi: false,
        //     arrayFilters: [{ "target._id": managerId }]
        //   },
        //   function(err, docs) {
        //     if (err) {
        //       res.status(500).send(err.message);
        //     } else {
        //       if (docs == null) {
        //         res.status(404).send("user not found");
        //       } else {
        //         res.status(201).send(docs);
        //       }
        //     }
        //   }
        // );
        // }
      }
    });
  }
});

//all managers
router.get("/all/:ownerid", (req, res, next) => {
  var owner_id = req.params.ownerid;
  managerCollection.findOne({ owner_id: owner_id }, (err, manager) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (manager == null) {
        res.status(404).send("Owner not found");
      } else {
        res.status(200).send(manager);
      }
    }
  });
});

//edit manager info
router.put("/:managerid", (req, res, next) => {
  var managerId = req.params.managerid;
  var owner_id = req.query.owner;
  var managerInfo = {
    _id: managerId,
    name: req.body.name,
    active:true,
    image: req.body.image,
    contact_info: req.body.contact_info
  };

  managerCollection.findOneAndUpdate(
    { owner_id: owner_id },
    {
      $set: {
        "managers.$[target]": managerInfo
      }
    },
    {
      multi: false,
      arrayFilters: [{ "target._id": managerId }]
    },
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs == null) {
          res.status(404).send("user not found");
        } else {
          res.status(200).send(managerInfo);
        }
      }
    }
  );
});

router.delete("/quit/:managerid", (req, res) => {
  var owner_id = req.query.owner;
  var managerId = req.params.managerid;
  managerCollection.findOneAndUpdate(
    { owner_id: owner_id },
    {
      $set: {
        "managers.$[target].active": false
      }
    },
    {
      multi: false,
      arrayFilters: [{ "target._id": managerId }]
    },
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs == null) {
          res.status(404).send("user not found");
        } else {
          res.status(200).send("updated successfully , manager quit");
        }
      }
    }
  );
});

// delete manager
router.delete("/:managerid", (req, res, next) => {
  var owner_id = req.query.owner;
  var managerId = req.params.managerid;

  managerCollection.update(
    { owner_id: owner_id },
    { $pull: { managers: { _id: managerId } } },
    (err, result) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (result.n == 0 || result.nModified == 0) {
          res.status(404).send("something not found");
        } else {
          res.status(200).send(deleted);
        }
      }
    }
  );
});

// manager detail
router.get("/detail/:managerid", (req, res, next) => {
  var managerId = req.params.managerid;
  var owner_id = req.query.owner;
  managerCollection.find(
    { owner_id: owner_id, "managers._id": managerId },
    { "managers.$": 1 },
    function(err, docs) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (docs.length == 0) {
          res.status(404).send("owner or manager not found");
        } else {
          docs = docs[0];
          res.status(200).send(docs.managers[0]);
        }
      }
    }
  );
});

router.get("/findowner/:managerId", (req, res, next) => {
  var managerId = req.params.managerId;
  managerCollection.findOne(
    { "managers._id": managerId },
    { owner_id: 1 },
    (err, data) => {
      res.send(data);
    }
  );
});

module.exports = router;
