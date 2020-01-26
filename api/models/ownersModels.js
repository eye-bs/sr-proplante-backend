var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ownerSchema = new Schema({
  _id: String,
  name: String,
  email: String,
  manager_id: String
});

module.exports = mongoose.model('owners' , ownerSchema);