const express = require('express');
const Shift = require( '../models/Shift');

var multer = require( 'multer');
var upload = multer({ dest: './client/pdfs'});
var parseRota = require( '../models/pdfRotaParser');

const router = new express.Router();

router.get( '/apo/shift', (req,res) => Shift.find( req, res));
router.post( '/apo/shift', (req,res) => Shift.create( req, res));
router.delete( '/apo/shift', (req,res) => Shift.delete( req, res));

router.post( '/apo/upload', upload.single( 'pdf'), function( req, res){
  console.log( "@POST api/upload filepath:", req.file.path);
  console.log( "import_flag:", req.body.import_flag);
  const import_flag = req.body.import_flag;
  const filename = req.file.originalname;
  const ext = filename.substr(filename.lastIndexOf('.')+1);
  if( ext === "pdf"){
    parseRota( req.file.path, import_flag)
    .then( function( shifts){
      res.send( shifts);
    });
  } else {
    res.send( { error_message:"Filetype not supported"});
  }
});

module.exports = router;
