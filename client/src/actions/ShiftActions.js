import dispatcher from "../dispatcher";

import Auth from '../modules/Auth';

export function loadShifts( year, month){
  dispatcher.dispatch( {type: "FETCH_SHIFTS"});

  fetch( `/api/shift`, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: Auth.getToken(),
    },
    body: JSON.stringify({ year, month }),
  })
  .then( checkStatus)
  .then( parseJSON)
  .then( (response) => {
    if( response.success){
      dispatcher.dispatch( { type: "RECEIVE_SHIFTS", response});
    } else {
      console.error( "loadShifts failed:", response);
      dispatcher.dispatch( {type: "RECEIVE_SHIFTS_FAILED", error: response});
    }
  })
  .catch( (err) => {
    console.error( "get shift failed:", err);
    dispatcher.dispatch( {type: "RECEIVE_SHIFTS_FAILED", error: err});
  });
}

export function createShift( shift){
  dispatcher.dispatch( { type: "CREATE_SHIFT"});

  fetch( "/api/shift", {
    method: "put",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      authorization: Auth.getToken(),
    },
    body: JSON.stringify( shift)
  })
  .then( checkStatus)
  .then( parseJSON)
  .then( (response) => {
    dispatcher.dispatch( { type: "CREATE_SHIFT_SUCCESS", shift: response});
  })
  .catch( (err) => {
    console.error( "create shift failed:", err);
    dispatcher.dispatch( { type: "CREATE_SHIFT_FAILED", error: err});
  });
}

export function deleteShift( shift_id){
  dispatcher.dispatch( {type: "DELETE_SHIFT"});
  console.log( "delete shift:", shift_id);
  fetch( "/api/shift", {
    method: 'delete',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      authorization: Auth.getToken(),
    },
    body: JSON.stringify( {shift_id})
  })
  .then(checkStatus)
  .then(parseJSON)
  .then(response => {
    dispatcher.dispatch({ type: "DELETE_SHIFT_SUCCESS", shift_id});
  })
  .catch( (err) => {
    console.error("@ShiftActions.deleteShift failed:", err);
    dispatcher.dispatch({ type: "DELETE_SHIFT_FAILED" });
  });
}

// FIXME: duplicate of containers/Actions.js
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(`HTTP Error ${response.statusText}`);
  error.status = response.statusText;
  error.response = response;
  console.error(error); // eslint-disable-line no-console
  throw error;
}

function parseJSON(response) {
  return response.json();
}
