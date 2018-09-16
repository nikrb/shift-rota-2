const express = require('express');
const multer = require( 'multer');
const upload = multer({ dest: process.env.upload_directory});
const parseRota = require( '../models/pdfRotaParser');
const { populateUserIds } = require('../ShiftUtils');
const ShiftActions = require('../ShiftActions');

const router = new express.Router();

router.post( '/shift', (req,res) => ShiftActions.find( req, res));
router.put( '/shift', (req,res) => ShiftActions.create( req, res));
router.delete( '/shift', (req,res) => ShiftActions.delete( req, res));

router.post( '/upload', upload.single( 'pdf'), function( req, res){
  console.log( "@POST api/upload filepath:", req.file.path);
  console.log( "import_flag:", req.body.import_flag);
  console.log( "request user:", req.user._id, req.user.name);
  const import_flag = req.body.import_flag === 'true';
  const filename = req.file.originalname;
  const ext = filename.substr(filename.lastIndexOf('.')+1);
  if( ext === "pdf"){
    parseRota( req.file.path)
    .then( function( shifts){
      if (import_flag) {
        const shift_list = populateUserIds(shifts);
        console.log('shift lsit:', shift_list);
        ShiftActions.createShifts(shift_list);
      }
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
