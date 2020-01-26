const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const dataCollection = require("../models/managersModels");

router.post("/", (req, res, next) => {
  var managerId = req.body.id;
  dataCollection
    .find()
    .exec()
    .then(docs => {
      if (docs == "" || docs == null) {
        res.status(404).send({ success: false });
      } else {
        if (managerId.length == 8) {
          var loginCheck = checkManagerCode(docs, managerId);
          res.status(200).send(loginCheck);
        }else{
          var loginCheck = checkPhoneNumber(docs, managerId);
          res.status(200).send(loginCheck);
        }
      }
    })
    .catch(err => {
      res.json({ message: err.message });
    });
});

function checkManagerCode(docs, managerId) {
  var managerData = { success: false };
  for (let i = 0; i < docs.length; i++) {
    var managers = docs[i].managers;
    for (let j = 0; j < managers.length; j++) {
      if (managers[j].id == managerId) {
        var firstLogin = managers[j].name == "" ? true : false;
        managerData = {
          success: true,
          id: managerId,
          owner_id: docs[i].owner_id,
          name: managers[j].name,
          image: managers[j].image,
          contact_info: managers[j].contact_info
        };
        console.log(managerData);
        return managerData;
      }
    }
  }
}

function checkPhoneNumber(docs, managerId){
  var managerData = { success: false };
  for (let i = 0; i < docs.length; i++) {
    var managers = docs[i].managers;
    for (let j = 0; j < managers.length; j++) {
      var info = managers[j].contact_info;
      var firstLogin = managers[j].name == "" ? true : false;
      if (info.phone == managerId) {
        managerData = {
          id: managers[j].id,
          owner_id: docs[i].owner_id,
          name: managers[j].name,
          image: managers[j].image,
          contact_info: managers[j].contact_info
        };
        return managerData;
      }
    }
  }
}

module.exports = router;
