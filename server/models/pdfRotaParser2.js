var moment = require( 'moment');
var PdfReader = require( 'pdfreader').PdfReader;
const { isUserValid } = require('../ShiftUtils');

/* personal rota format from data read via PdfReader

Latest version has been refactored and we now search for client names,
then work backwards to get the date and pluck the start/end times.
Then we normalise so the overnight shifts merge.
This will cause issues for multiple contiguous shifts, ignored for now.

day/night shift formats are different (night shift is split in two, 4 + 11)
day shift:
[0]Date - day nth month year (e..g Tuesday 12th September 2016)
...
[8]hours for shift ( 0800 to 1700 e.g. 09:00)
[9]client name
[10]end time
[11]start time


night shift:
[0]Date - day nth month year (e..g Tuesday 12th September 2016)
[8]hours for 1st part shift (1700 to 2100) ##:## (e.g. 04:00)
[9]client name
[10]end time
[11]start time
[12]hour for 2nd part shift (2100 to 0800) ##:## (e.g. 11:00)
[13]client name
[14]end time
[15]start time

looks like we need to find the start of the detail as hours isn't always at offset 8
*/
// new version of shift rota has an extra 00 field
var HOURS1 = 0, // 8,
    // UNKNOWN_00 = 1,
    NAME1 = 1, // 9,
    END1 = 2, // 10,
    START1 = 3, // 11,
    HOURS2 = 4, // 12,
    ZERO_MINUTES = 5,
    NAME2 = 6, // 13,
    END2 = 7, // 14,
    START2 = 8 // 15;
var weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function hasWeekday( str){
  if (!str) return false;
  let ret = false;
  for( var i = 0; i < weekdays.length; i++){
    if( str.startsWith(weekdays[i])){
      ret = true;
    }
  }
  return ret;
}

function getDateString(lines, ndx) {
  let i = ndx;
  let date_str = "";
  const year_re = new RegExp( /20[12][0-9]/);
  while( i < lines.length){
    date_str += lines[i];
    if( date_str.match( year_re)){
      break;
    }
    i++;
  }
  return date_str;
}

function getHoursIndex(lines, ndx) {
  let i = ndx;
  const hours_re = new RegExp( /^[0-9][0-9]:00$/);
  while( i < lines.length){
    if( lines[i].match( hours_re)){
      break;
    }
    i++;
  }
  return i;
}

function findShiftDate(lines, ndx) {
  let ret = '';
  for (let i = ndx; i > 0; i--) {
    if (hasWeekday(lines[i])) {
      ret = lines[i];
      // date is sometimes split into two cells
      if (!/[0-9]/.test(lines[i])) {
        ret = ret.concat(lines[i+1]);
      }
      break;
    }
  }
  return ret;
}

function normaliseShifts(shifts) {
  const ret = [];
  let last = { start_date: "", end_time: "" };
  for (let i=0; i< shifts.length; i++) {
    const dt = moment( shifts[i].start_date, "dddd DD MMMM YYYY");
    const hours_end = shifts[i].end_time.split(':')[0];
    if (last.start_date === shifts[i].start_date &&
        last.end_time === shifts[i].start_time) {
      shifts[i-1].end_time = shifts[i].end_time;
      shifts[i-1].end_datetime = moment(dt).add(1, 'day').hours(hours_end);
    } else {
      const hours_start = shifts[i].start_time.split(':')[0];
      shifts[i].start_datetime = moment(dt).hours(hours_start);
      shifts[i].end_datetime = moment(dt).hours(hours_end);
      ret.push(shifts[i]);
    }
    last = shifts[i];
  }
  return ret;
}

function getOwner(lines) {
  const re = /visit schedule for (.*)$/i;
  return lines.reduce((acc, line) => {
    const m = line.match(re);
    if (m) {
      return m[1];
    }
    return acc
  }, '');
}

function parseShifts(lines) {
  const shifts = [];
  const namere = /^[a-z ]+$/i
  for (let i=0; i<lines.length; i++) {
    if (namere.test(lines[i])) {
      // we might have a client
      if (isUserValid(lines[i])) {
        const start_date = findShiftDate(lines, i);
        const s = {
          start_date,
          client_name: lines[i],
          start_time: lines[i+2],
          end_time: lines[i+1],
        };
        shifts.push(s);
      }
    }
  }
  return shifts;
}

function parseRota( filepath){
  var lines = [];
  return new Promise( function( resolve, reject){
    new PdfReader().parseFileItems( filepath, function(err, item){
      if( err){
        console.error( "pdf parse failed:", err);
        reject(err);
      } else {
        if (item && item.text){
          lines.push( item.text);
        } else {
          if( item == null){
            // no item seems to be EOF
            resolve( lines);
          } else if( item.text == null){
            // no item text - page end I'm guessing
          }
        }
      }
    });
  });
}

module.exports = {
  parseRota,
  parseShifts,
  normaliseShifts,
  getOwner,
};
