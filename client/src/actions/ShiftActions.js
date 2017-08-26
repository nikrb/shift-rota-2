import dispatcher from "../dispatcher";

export function loadShifts( year, month){
  dispatcher.dispatch( {type: "FETCH_SHIFTS"});

  fetch( `/apo/shift?year=${year}&month=${month}`)
  .then( checkStatus)
  .then( parseJSON)
  .then( (response) => {
    console.log( "get shift response:", response);
    dispatcher.dispatch( { type: "RECEIVE_SHIFTS", shifts: response});
  })
  .catch( (err) => {
    console.log( "get shift failed:", err);
    dispatcher.dispatch( {type: "RECEIVE_SHIFTS_FAILED", error: err});
  });
}

export function createShift( shift){
  dispatcher.dispatch( { type: "CREATE_SHIFT"});
  fetch( "/apo/shifts", {
    method: "post",
    body: JSON.stringify( shift)
  })
  .then( checkStatus)
  .then( parseJSON)
  .then( (response) => {
    dispatcher.dispatch( { type: "CREATE_SHIFT_SUCCESS", shift: response});
  })
  .catch( (err) => {
    console.log( "create shift failed:", err);
    dispatcher.dispatch( { type: "CREATE_SHIFT_FAILED", error: err});
  });
}

export function deleteShift( shift_id){
  dispatcher.dispatch( {type: "DELETE_SHIFT"});

  fetch( "/apo/shift", {
    method: 'post',
    body: JSON.stringify( {shift_id})
  })
  .then( checkStatus)
  .then( parseJSON)
  .then( (response) => {
    dispatcher.dispatch( { type: "DELETE_SHIFT_SUCCESS", shift_id});
  })
  .catch( (err) => {
    console.log( "@ShiftActions.deleteShift failed:", err);
    dispatcher.dispatch( { type: "DELETE_SHIFT_FAILED"});
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
