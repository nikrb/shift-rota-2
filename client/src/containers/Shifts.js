import React from 'react';
import Dropzone from 'react-dropzone';
import moment from 'moment';

export default class Shifts extends React.Component {
  constructor(){
    super();
    this.state = {
      shifts : [],
      shift_html: null,
      file : null,
      show_date : new moment()
    };
    this.import_flag = false;
  }
  onDrop( files){
    const that = this;
    const data = new FormData();
    data.append( 'pdf', files[0]);
    data.append( 'import_flag', this.import_flag);
    fetch( "/apo/upload", {
      method: 'post',
      body: data
    })
    .then(res => res.json())
    .then(function(response) {
      console.log( "file upload response:", response);
      // output shifts as html
      const shift_html = response.shifts.map(sh => (
        <tr key={sh.start_time}>
          <td>{sh.owner_name}</td>
          <td>{sh.client_name}</td>
          <td>{sh.start_time}</td>
          <td>{sh.end_time}</td>
        </tr>
      ));
      that.setState( { shifts : response.shifts, shift_html});
    })
    .catch( function(err) {
      console.error( "file upload error:", err);
    });
  }
  importChange = ( ev) => {
    this.import_flag = ev.target.checked;
  };
  render() {
    const { shift_html } = this.state;
    const textarea_style = {
      width: "100%"
    };
    // const days_in_month = this.state.show_date.daysInMonth();
    // let shift_table = "";
    // FIXME: in order to show a ShiftTable we need to organise the shifts
    // into day and night and fill in missing shifts with slot_date member
    // if( this.state.shifts.length){
    //   shift_table = <ShiftTable show_date={this.state.show_date} shifts={this.state.shifts}
    //               days_in_month={days_in_month} />;
    // }
    return (
      <div className="container text-center rota-wrapper">
        <h4>Rota Import</h4>
        <div className="well">
          <Dropzone ref="dropzone" onDrop={this.onDrop.bind(this)}>
            Drop your rota here, or click to select
          </Dropzone>
        </div>
        <div>
          <input type="checkbox" onChange={this.importChange}/>Import
        </div>
        <div>
          {shift_html ?
            <table>
              <thead>
                <tr><th>Owner</th><th>Client</th><th>Start</th><th>End</th></tr>
              </thead>
              <tbody>
                {shift_html}
              </tbody>
            </table>
            : <div>No Shifts</div>
          }
        </div>
        <div>
          <textarea style={textarea_style} value={JSON.stringify( this.state.shifts)} readOnly></textarea>
        </div>
      </div>
    );
  }
}
