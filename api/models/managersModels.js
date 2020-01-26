var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var managerSchema = new Schema({
  _id: String,
  owner_id: String,
  managers: [{
    _id: String,
    name: String,
    image: String,
    active: Boolean,
    contact_info: {
      address: String,
      phone: String
    }
  }]
});

module.exports = mongoose.model('managers' , managerSchema);