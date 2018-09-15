var moment = require( 'moment');
var MongoClient = require('mongodb').MongoClient;
// var ObjectId = require('mongodb').ObjectID;

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

function getUserIdFromNameInitials( users, name){
  var init = getInitials(name);
  return users.reduce(
    (acc, cur) => cur.initials === init ? cur._id : acc, null);
}
function getAllUsers(){
  return new Promise( function( resolve, reject){
    db.collection( "users").find({}).toArray( function( err, users){
      if( err){
        reject( err);
      } else {
        resolve( users);
      }
    });
  });
}
function getInitials( name) {
  const names = name.split(' ');
  const initials = names.reduce(
    (acc,cur) => acc.concat(cur.charAt().toUpperCase()), '');
  return initials;
}

function populateUserIds( shift_list){
  // FIXME: remove shifts for clients we can't find (handle training days)
  const shifts = shift_list.map( function( ele){
    const owner_id = getUserIdFromNameInitials( user_list, ele.owner_name);
    const client_id = getUserIdFromNameInitials( user_list, ele.client_name);
    return {
      owner_id,
      client_id,
      start_time : ele.start_time.toDate(),
      end_time : ele.end_time.toDate(),
    };
  });
  return shifts;
}

function createShifts(shifts) {
  db.collection("shift").insert(shifts);
}

module.exports = {
  populateUserIds,
  createShifts,
};
