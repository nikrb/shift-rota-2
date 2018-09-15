var moment = require( 'moment');
var PdfReader = require( 'pdfreader').PdfReader;

/* personal rota format from data read via PdfReader
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
  var ret = false;
  for( var i=0; i< weekdays.length; i++){
    var re = new RegExp( weekdays[i]);
    if( str.match( re)){
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
function generateShiftList( lines){
  var owner_name = "";
  var shift_list = [];
  for( let i=0; i < lines.length; i++){
    if( hasWeekday( lines[i])){
      console.log('found shift:', lines[i]);
      // first gather the date, may go over several 'fields'
      const date_str = getDateString(lines, i);
      // find the hours
      i = getHoursIndex(lines, i);
      const dt = moment( date_str, "dddd DD MMMM YYYY");
      let hours = parseInt(lines[i+HOURS1]);
      const client_name = lines[i+NAME1];
      const start = lines[i+START1].split(':');
      let start_time, end_time;

      // only night shift has HOURS2
      const total_re = /total time for this date/i;
      if (total_re.test(lines[i+HOURS2])) {
        start_time = moment(dt).hours(start[0]);
        end_time = moment(dt).hours(hours + parseInt(start[0]));
        console.log(`day shift start[${start_time}] end[${end_time}]`);
      } else {
        hours +=  parseInt(lines[i+HOURS2]);
        start_time = moment(dt).hours(start[0]);
        end_time = moment(dt).hours(hours + parseInt(start[0]));
        console.log(`night shift start[${start_time}] end[${end_time}]`);
      }
      const new_shift = { client_name: client_name, owner_name : owner_name,
        start_time: start_time, end_time: end_time};
      shift_list.push( new_shift);
    } else {
      if( owner_name === "" && lines[i].indexOf( "Visit schedule for") === 0){
        owner_name = lines[i].substring( 19);
        // keepUserName( owner_name);
      }
    }
  }
  return shift_list;
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
            const shift_list = generateShiftList( lines);
            resolve( shift_list);
          } else if( item.text == null){
            // no item text - page end I'm guessing
          }
        }
      }
    });
  });
}

module.exports = parseRota;
