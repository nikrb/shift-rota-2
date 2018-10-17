require( 'dotenv').config();
require( '../server/models').connect( process.env.dbUri);

const { populateUserIds, init } = require('../server/ShiftUtils');
const ShiftActions = require('../server/ShiftActions');
const { parseRota, parseShifts, normaliseShifts, getOwner } = require( '../server/models/pdfRotaParser2');

const [p, s, filename, import_flag = false, ...rest] = process.argv;

console.log(`filename[${filename}] import[${import_flag}] rest[${rest}]`);

if (typeof filename === 'undefined' || filename === 'help' || rest.length > 0) {
  console.log(`usage: parsePdf filename [import_flag]`);
  process.exit(1);
}

init().then(() => {
  parseRota(filename)
  .then( lines => {
    // console.log(lines);
    const owner = getOwner(lines);
    const shifts = parseShifts(lines);
    const normalised = normaliseShifts(shifts);
    console.log("parsed shifts:", normalised);

    const shift_list = populateUserIds(owner, normalised);
    console.log('shift list:', shift_list);
    // if (import_flag) {
    //   ShiftActions.createShifts(shift_list);
    // }
    process.exit(0);
  });
});
