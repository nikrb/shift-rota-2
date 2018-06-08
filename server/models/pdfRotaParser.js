
module.exports = parseRota;

var moment = require( 'moment');
var PdfReader = require( 'pdfreader').PdfReader;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

// create a *unique* list of user (owner/client) names to pull from db
// list is now { name, _id|null }
var user_list = [];
var db;
var url = process.env.dbUri;
console.log('mongo:', process.env.dbUri);
MongoClient.connect(url, function(err, dbc) {
  if( err){
    console.error( "mongo connect error:", err);
  }
  db = dbc;
  getAllUsers().then( function( users){
    user_list = users;
    console.log( "user list loaded");
  });
});


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
    NAME2 = 5, // 13,
    END2 = 6, // 14,
    START2 = 7 // 15;
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

function getUserIdFromNameInitials( users, name){
  var init = getUsersInitials( [name])[0];
  for( let i=0; i < users.length; i++ ){
    if( users[i].initials === init){
      return users[i]._id;
    }
  }
  return null;
}
function getUsersInitials( names){
  let initials = [];
  names.forEach( function( name){
    const bits = name.split( " ");
    initials.push( bits[0].charAt(0).toUpperCase() +
      bits[bits.length-1].charAt(0).toUpperCase());
  });
  return initials;
}
function getAllUsers(){
  return new Promise( function( resolve, reject){
    db.collection( "user").find({}).toArray( function( err, users){
      if( err){
        reject( err);
      } else {
        resolve( users);
      }
    });
  });
}
function getInitials( name) {
  const re = /([a-zA-Z])[a-z]+\s([a-zA-Z])[a-z]+/;
  const m = name.match( re);
  return m[1]+m[2];
}
function userInitialsExists( ini) {
  const ret = user_list.filter( function( user) {
    return user.initials === ini;
  });
  return ret.length > 0;
}
function userExists( name){
  const ret = user_list.filter( function( user){
    return user.name === name;
  });
  return ret.length > 0;
}
function generateShiftList( lines){
  var owner_name = "";
  var shift_list = [];
  for( let i=0; i < lines.length; i++){
    if( hasWeekday( lines[i])){
      // first gather the date, may go over several 'fields'
      let date_str = "";
      // FIXME: handle other eyars
      const year_re = new RegExp( /201[6789]/);
      while( i < lines.length){
        date_str += lines[i];
        if( date_str.match( year_re)){
          break;
        }
        i++;
      }
      // find the hours
      const hours_re = new RegExp( /^[0-9][0-9]:00$/);
      while( i < lines.length){
        if( lines[i].match( hours_re)){
          break;
        }
        i++;
      }
      var dt = moment( date_str, "dddd DD MMMM YYYY");
      var hours = lines[i+HOURS1];
      var client_name = lines[i+NAME1];
      var start_time, end_time;
      if( hours === "04:00"){
        // night shift
        start_time = moment(dt).hours( 17);
        end_time = moment( dt).hours( 17+15);
      } else {
        start_time = moment( dt).hours( 8);
        end_time = moment( dt).hours( 17);
      }
      const inits = getInitials( client_name);
      if( userInitialsExists( inits)){
        const new_shift = { client_name: client_name, owner_name : owner_name,
          start_time: start_time, end_time: end_time};
        shift_list.push( new_shift);
        // console.log( "found shift:", new_shift);
      } else {
        console.log( `invalid shift, client name [${client_name}]` );
      }
    } else {
      if( owner_name === "" && lines[i].indexOf( "Visit schedule for") === 0){
        owner_name = lines[i].substring( 19);
        // keepUserName( owner_name);
      }
    }
  }
  return shift_list;
}
function populateUserIds( shift_list){
  // remove shifts for clients we can't find (handle training days)
  var shifts = shift_list.map( function( ele){
    var ownerId = getUserIdFromNameInitials( user_list, ele.owner_name);
    var clientId = getUserIdFromNameInitials( user_list, ele.client_name);
    return {
      owner_id : ownerId,
      client_id : clientId,
      start_time : ele.start_time.toDate(),
      end_time : ele.end_time.toDate()
    };
  });
  return shifts;
}

function parseRota( filepath, import_flag){
  var lines = [];
  return new Promise( function( resolve, reject){
    new PdfReader().parseFileItems( filepath, function(err, item){
      if( err){
        console.error( "pdf parse failed:", err);
      } else {
        if (item && item.text){
          lines.push( item.text);
        } else {
          if( item == null){
            // no item seems to be EOF
            const shift_list = generateShiftList( lines);
            const shifts = populateUserIds( shift_list);
            if( import_flag){
              db.collection( "shift").insert( shifts);
            }
            resolve( shifts);
          } else if( item.text == null){
            // no item text - page end I'm guessing
          }
        }
      }
    });
  });
}
