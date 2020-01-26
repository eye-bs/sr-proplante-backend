const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const dataCollection = require("../models/managersModels");

router.post("/", (req, res, next) => {
  var id = req.body.id;

  dataCollection
    .find()
    .exec()
    .then(docs => {
      if (docs == "" || docs == null) {
      } else {
        registerManager(docs, id);
      }
    })
    .catch(err => {
      res.json({ message: err });
    });
  function registerManager(docs, id) {
    var name = req.body.name;
    var contact_info = req.body.contact_info;
    var image = req.body.image || "";

    for(let i = 0; i < docs.length; i++){
      var managers = docs[i].managers
      for(let j = 0; j < managers.length ; j++){
        if(managers[j].id == id){
          var managerInfo = {
            id: id,
            name: name, 
            image: image,
            contact_info: contact_info
          }
          dataCollection.findOneAndUpdate(
            { owner_id: docs[i].owner_id },
            {
              $set: {
                owner_id: docs[i].owner_id,
                managers: managerInfo
              }
            },
            function(err, docs) {
              if (err) {
                res.status(500).send({success:false});
              } else {
                res.status(201).send({ owner_id: docs.owner_id,
                  manager: managerInfo});
              }
            }
          );
          break;
        }
      }
    }
  }
});

module.exports = router;
