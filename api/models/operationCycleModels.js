var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var operationCycleSchema = new Schema({
  _id: String,
  owner_id: String,
  land_id: String,
  logs: {
    plant_id: String,
    start_date: String,
    end_date: String,
    expected_product: Number,
    real_product: Number,
    performance: Number,
    activities: [
      {
        _id: String,
        task: String,
        status: String,
        activity_type: String,
        end_date: String,
        notes: String,
        images: [String],
        manager_id: String
      }
    ]
  }
});

module.exports = mongoose.model("operation", operationCycleSchema);
