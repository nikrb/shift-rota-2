import React from 'react';
import Dropzone from 'react-dropzone';
import moment from 'moment';

import Auth from '../modules/Auth';

import Loader from '../components/Loader';

export default class Shifts extends React.Component {
  constructor(){
    super();
    this.state = {
      is_loading: false,
      owner: 'no owner',
      shift_html: null,
      file : null,
      show_date : new moment()
    };
    this.import_flag = false;
  }
  onDrop( files){
    this.setState({ is_loading: true });
    const that = this;
    const data = new FormData();
    data.append( 'pdf', files[0]);
    data.append( 'import_flag', this.import_flag);
    fetch( "/api/upload", {
      method: 'post',
      headers: {
        authorization: Auth.getToken(),
      },
      body: data,
    })
    .then(res => res.json())
    .then(function(response) {
      console.log( "file upload response:", response);
      const { owner } = response;
      // output shifts as html
      // TODO: fix date and time formats
      const shift_html = response.shifts.map(sh => (
        <tr key={sh.start_datetime}>
          <td>{sh.client_name}</td>
          <td>{sh.start_datetime}</td>
          <td>{sh.end_datetime}</td>
        </tr>
      ));
      that.setState( { shift_html, owner, is_loading: false });
    })
    .catch( function(err) {
      console.error( "file upload error:", err);
    });
  }
  importChange = ( ev) => {
    this.import_flag = ev.target.checked;
  };
  render() {
    const { shift_html, owner, is_loading } = this.state;
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
          Rota Owner: {owner}
        </div>
        { is_loading ? <Loader /> : null }
        <div>
          {shift_html ?
            <table>
              <thead>
                <tr><th>Client</th><th>Start</th><th>End</th></tr>
              </thead>
              <tbody>
                {shift_html}
              </tbody>
            </table>
            : <div>No Shifts</div>
          }
        </div>
      </div>
    );
  }
}
