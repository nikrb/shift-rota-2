const express = require('express');
const multer = require( 'multer');
const upload = multer({ dest: process.env.upload_directory});
const {
  parseRota,
  getOwner,
  parseShifts,
  normaliseShifts
} = require( '../models/pdfRotaParser2');
const { populateUserIds, init } = require('../ShiftUtils');
const ShiftActions = require('../ShiftActions');

const router = new express.Router();

init();

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
    .then( function( lines){
      const owner = getOwner(lines);
      const parsed = parseShifts(lines);
      const shifts = normaliseShifts(parsed);

      let success = false;
      let errmsg = "";
      if (import_flag) {
        const shift_list = populateUserIds(owner, shifts);
        ShiftActions.createShifts(shift_list)
        .then(results => {
          console.log('createShifts results:', results);
          success = true;
        })
        .catch(e => {
          console.log('createShifts error:', e.errmsg);
          errmsg = e.errmsg;
        });
      }
      res.send( { success, shifts, owner, errmsg });
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
