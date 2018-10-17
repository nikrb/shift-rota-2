const moment = require( 'moment');
const User = require('./models/user');

// create a *unique* list of user (owner/client) names to pull from db
// list is now { name, _id|null }
let user_list = [];
function init() {
  return User.find()
  .then( function( users){
    user_list = users;
    console.log('user list loaded:', users);
    return users;
  })
  .catch(e => {
    console.error('user list init failed:', e);
    process.exit(1);
  });
}

function isUserValid(name) {
  const init = getInitials(name);
  const res = user_list.filter(u => u.initials === init);
  return res.length === 1;
}

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

function populateUserIds(owner_name, shift_list){
  const owner_id = getUserIdFromNameInitials( user_list, owner_name);
  const shifts = shift_list.map( function( ele){
    const client_id = getUserIdFromNameInitials( user_list, ele.client_name);
    return {
      owner_id,
      client_id,
      start_time : ele.start_datetime.toDate(),
      end_time : ele.end_datetime.toDate(),
    };
  });
  return shifts;
}

module.exports = {
  populateUserIds,
  init,
  isUserValid,
};
