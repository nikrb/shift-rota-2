import dispatcher from "../dispatcher";

export function loadUsers(){
  dispatcher.dispatch( {type: "FETCH_USERS"});
  fetch( "/apo/users")
  .then( (response) => {
    dispatcher.dispatch( {type: "RECEIVE_USERS", categories: response.data});
  })
  .catch( (err) => {
    dispatcher.dispatch( {type: "RECEIVE_USERS_FAIL", error:err});
    console.log( "GET api/users failed:", err);
  });
}
