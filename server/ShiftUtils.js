const moment = require( 'moment');
const User = require('./models/user');

// create a *unique* list of user (owner/client) names to pull from db
// list is now { name, _id|null }
var user_list = [];

User.find().then( function( users){
  user_list = users;
  console.log( "user list loaded");
});

function getUserIdFromNameInitials( users, name){
  var init = getInitials(name);
  return users.reduce(
    (acc, cur) => cur.initials === init ? cur._id : acc, null);
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

module.exports = {
  populateUserIds,
};
