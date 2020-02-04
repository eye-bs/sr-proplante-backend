const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var busboy = require("connect-busboy");

const ownerRoutes = require("./api/routes/ownerRoutes");
const managerRoutes = require("./api/routes/managerRoutes");
const landsRoutes = require("./api/routes/landsRoutes");
const operationsRoute = require("./api/routes/operationRoutes");
const plantRoutes = require("./api/routes/plantsRoutes");
const activitiesRoutes = require("./api/routes/activitiesRoutes");
const reportRoutes = require("./api/routes/reportRoutes");
const mongoUpload = require("./api/routes/mongoUpload");

//side function
const sideLandsRoutes = require("./api/routes/sideLandsRoutes");

const dburl = "68.183.230.159:27017"
// const dburl = "pp-db";

mongoose.connect("mongodb://" + dburl + "/proplanteDB", function(err) {
  if (err) throw err;
  console.log(
    "(∩｀-´)⊃━✿✿✿✿✿✿ -Connect to Proplante MongoDB at '" +
      dburl +
      "' successful!- ★★★★★★≡≡＼（`△´＼）"
  );
});

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(busboy());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// makes 'uploads' folder to public
app.use(express.static("uploads"));

app.use("/owners", ownerRoutes);
app.use("/managers", managerRoutes);
app.use("/lands", landsRoutes);
app.use("/operations", operationsRoute);
app.use("/plants", plantRoutes);
app.use("/activities", activitiesRoutes);
app.use("/reports", reportRoutes);
//-------side---------------
app.use("/sec/lands", sideLandsRoutes);
app.use("/images", mongoUpload);

app.use("/healthy", (req, res, next) => {
  res.status(200).send("server-health");
});

app.use((req, res, next) => {
  const error = new Error("Not found!!");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;
