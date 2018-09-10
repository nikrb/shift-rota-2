const express = require('express');
var multer = require( 'multer');
var upload = multer({ dest: process.env.upload_directory});
var parseRota = require( '../models/pdfRotaParser');

const Shift = require( '../models/Shift');

const router = new express.Router();

router.post( '/shift', (req,res) => Shift.find( req, res));
router.put( '/shift', (req,res) => Shift.create( req, res));
router.delete( '/shift', (req,res) => Shift.delete( req, res));

router.post( '/upload', upload.single( 'pdf'), function( req, res){
  console.log( "@POST api/upload filepath:", req.file.path);
  console.log( "import_flag:", req.body.import_flag);
  console.log( "request user:", req.user._id, req.user.name);
  const import_flag = req.body.import_flag === 'true';
  const filename = req.file.originalname;
  const ext = filename.substr(filename.lastIndexOf('.')+1);
  if( ext === "pdf"){
    parseRota( req.file.path, req.user._id, import_flag)
    .then( function( shifts){
      res.send( { success: true, shifts});
    })
    .catch( function( err) {
      console.error( "parseRota failed:", err);
      res.send( { success: false, message: "failed to parse rota"});
    });
  } else {
    res.send( { success: false, message:"Filetype not supported"});
  }
});

module.exports = router;
