var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PlantSchema = new Schema({
  _id: String,
  owner_id: String,
  plants:[{
    _id: String,
    name: String,
    cover_image: String,
    activie: Boolean,
    activities: [{
      _id: String,
      tasks: String,
      duration: Number
    }]
  }]
});

module.exports = mongoose.model('plants' , PlantSchema);