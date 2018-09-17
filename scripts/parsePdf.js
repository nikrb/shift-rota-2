require( 'dotenv').config();
require( '../server/models').connect( process.env.dbUri);

const { populateUserIds, waitForInit } = require('../server/ShiftUtils');
const ShiftActions = require('../server/ShiftActions');
const parseRota = require( '../server/models/pdfRotaParser');

const [p, s, filename, import_flag = false, ...rest] = process.argv;

console.log(`filename[${filename}] import[${import_flag}] rest[${rest}]`);

if (typeof filename === 'undefined' || filename === 'help' || rest.length > 0) {
  console.log(`usage: parsePdf filename [import_flag]`);
  process.exit(1);
}

parseRota(filename)
.then( shifts => {
  console.log(shifts);
  const shift_list = populateUserIds(shifts);
  console.log('shift list:', shift_list);
  if (import_flag) {
    ShiftActions.createShifts(shift_list);
  }
  process.exit(0);
});
