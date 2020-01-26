var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var landSchema = new Schema({
  _id: String,
  owner_id: String,
  lands: [{
    _id: String,
    name: String,
    active_status: Boolean,
    province: String,
    district: String,
    area:String,
    points: [{
      lat: Number,
      lng: Number
    }]
  }]
});

module.exports = mongoose.model('lands' , landSchema);