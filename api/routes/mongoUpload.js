const express = require("express");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const dburl = "68.183.230.159:27017"
// const dburl = "pp-db";
const mongoURI = "mongodb://" + dburl + "/proplanteDB";
const conn = mongoose.createConnection(mongoURI);
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    var fileName;
    if(req.query.file_name != undefined){
      fileName = req.query.file_name + ".png";
    }
    else if (req.query.land != undefined || req.query.land != null) {
      fileName = req.query.land + "_" + Date.now() + ".png";
    } else if (req.query.manager != undefined || req.query.manager != null) {
      fileName = req.query.owner + "_" + req.query.manager + ".png";
    } else {
      fileName = req.query.owner + "_" + Date.now() + ".png";
    }
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        //const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: fileName,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // no larger than 1mb, you can change as needed.
  }
});

// @route POST /upload
// @desc  Uploads file to DB
router.post("/upload", upload.single("file"), (req, res) => {
  var img = req.file;
  gfs.files.find({ filename: img.filename }).toArray((err, file) => {
    // Check if file
    if (!file || file.length <= 1) {
      res.send(img.filename);
    } else {
      gfs.remove({ _id: file[0]._id, root: "uploads" }, (err, gridStore) => {
        if (err) {
          return res.status(404).json({ err: err });
        }
        res.send(img.filename);
      });
    }
  });
});

// @route GET /files
// @desc  Display all files in JSON
router.get("/files", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "No files exist"
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
router.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
router.get("/display/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }

    // Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
router.delete("/files/:id", (req, res) => {
  gfs.remove({ _id: req.params.id, root: "uploads" }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    res.send("delete image successfully")
  });
});

module.exports = router;
