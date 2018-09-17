const moment  = require( 'moment');
const Shift = require('./models/Shift');
const User = require('./models/user');

const datetime_format = "DD-MMM-YYYY HH:mm";
const date_format = "DD-MMM-YYYY"; // moment format

module.exports.createShifts = function(shifts) {
  Shift.insertMany(shifts).then(results => {
    console.log('createShifts results:', results);
  });
}

module.exports.create = async function( req, res){
  const { client_initials, start_time, end_time} = req.body;
  console.log( "insert new shift initials[%s] start[%s] end[%s]",
    client_initials, start_time, end_time);

  const owner = req.user.toObject();

  const client = await User.findOne({ initials: client_initials});
  if (client === null) {
    console.error('ShiftActions.create failed to get client user');
    return res.json({ error: 1, message: 'client not found'});
  }
  const shift = new Shift({
    owner_id : owner._id,
    client_id : client._id,
    start_time : new Date( start_time),
    end_time : new Date( end_time),
  });
  try {
    shift.save();
  } catch (e) {
    console.error('ShiftActions.create new shift save failed', e);
    return res.json({ error:1, message: 'Shift save failed'});
  }
  return res.json({ ...shift.toObject(), owner, client });
}

module.exports.delete = function( req, res){
  const shift_id = req.body.shift_id;
  console.log( "delete shift id:",shift_id);
  db.collection( "shifts").findOneAndDelete( { _id: ObjectId( shift_id)})
  .then( function( results){
    let ds = results.value;
    ds.deletion_date = new Date();
    db.collection( "shift_history").insertOne( results.value)
    .then( function( del_results){
      if( !del_results.result.ok ) {
        console.error( "shift insert into shift_history failed:", ds);
      }
    });
    res.json( { result: results.ok});
  })
  .catch( function( error){
    console.log( "@server/app.delete:/apo/shift failed", error);
    res.json( { err: error});
  });
};

module.exports.find = async function( req, res){
  const month = parseInt( req.body.month, 10);
  const year = parseInt( req.body.year, 10);
  const owner = req.user.toObject();

  console.log('request shifts by user:', owner._id, owner.name);
  const dt = moment( [year, month, 1]);
  console.log( "request date:", dt.format( date_format));
  const monday_start = moment( dt).isoWeekday(1).startOf( "day");
  console.log( "monday start date", monday_start.format( datetime_format));

  let sunday_end = moment( dt).add( 1, 'months').isoWeekday(7).endOf( "day");
  // console.log( "sunday end date", sunday_end.format( datetime_format));

  // if we have a full week of the next month, then don't include it
  if( sunday_end.date() >= 7){
    sunday_end.subtract( 1, 'week');
  }

  const shift_list = await Shift.find({
    owner_id: owner._id,
    start_time : { $gt : monday_start.toDate(), $lt : sunday_end.toDate()}
  });
  const promises = [];
  shift_list.forEach(mshift => {
    const shift = mshift.toObject();
    const promise = new Promise( function(resolve, reject){
      User.find( { _id : { $in: [
        shift.owner_id, shift.client_id
      ]}}).then(users => {
        if( shift.owner_id.toHexString() === users[0]._id.toHexString()){
          shift.owner = users[0];
          shift.client = users[1];
        } else {
          shift.owner = users[1];
          shift.client = users[0];
        }
        resolve( shift);
      });
    });
    promises.push( promise);
  });

  Promise.all( promises).then( function( shifts) {
    const payload = fillHoles( shifts, monday_start, sunday_end);
    res.json( { success: true, shifts: payload});
  });
};


// helpers ////////////////////////////////////////////////////////// helpers

function findShiftsByDay( target_date, shifts){
  const target_day = target_date.date();
  const target_month = target_date.month();
  let ret = [];
  shifts.forEach( function( shift){
    const src_day = shift.start_time.getDate();
    const src_month = moment( shift.start_time).month();
    if( target_day === src_day && target_month === src_month){
      ret.push( shift);
    }
  });
  return ret;
}
function fillHoles( shifts, start_date, end_date){
  // we want a date for every shift slot, even if a shift doesn't exist
  let current_shift_date = moment( start_date);
  // array of shifts to be generated and returned
  let ret = [];
  const total_days = end_date.diff( start_date, 'days');
  for( let day_count = 0; day_count <= total_days; day_count++){
    const shifts_for_day = findShiftsByDay( current_shift_date, shifts);
    let both_shifts = {
      day: { slot_date: current_shift_date.format( date_format)},
      night: { slot_date: current_shift_date.format( date_format)}
    };
    if( shifts_for_day && shifts_for_day.length ){
      shifts_for_day.forEach( function( shift){
        let sh_hour = shift.start_time.getHours();
        // FIXME: day/night boundary as midday
        if( sh_hour < 12 ){
          both_shifts.day = shift;
        } else {
          both_shifts.night = shift;
        }
      });
    }
    ret.push( both_shifts);
    current_shift_date.add( 1, 'day');
  }
  return ret;
};
