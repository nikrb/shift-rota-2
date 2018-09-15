require( 'dotenv').config();
const parseRota = require( '../server/models/pdfRotaParser');
const { populateUserIds, createShifts } = require('../server/models/ShiftUtils');

const [p, s, filename, import_flag = false, ...rest] = process.argv;

console.log(`filename[${filename}] import[${import_flag}] rest[${rest}]`);

if (typeof filename === 'undefined' || filename === 'help' || rest.length > 0) {
  console.log(`usage: parsePdf filename [import_flag]`);
  process.exit(1);
}

parseRota(filename)
  .then( shifts => {
    // console.log(shifts);
    const shift_list = populateUserIds(shifts);
    console.log('shift lsit:', shift_list);
    if (import_flag) {
      createShifts(shift_list);
    }
    process.exit(0);
  });
