import React from 'react';
import moment from 'moment';

export default class ShiftTableRow extends React.Component {
  cellClick( data){
    this.props.onShiftClicked( data, this.props.day_row);
  }
  render(){
    const hdr = this.props.day_row? <td>Day</td> : <td>Night</td>;
    return (
      <tr>{hdr}
          {this.props.cols.map( ( col, ndx) => {
            // if we don't have any shifts loaded yet use a dummy td
            if( col) {
              // slot_date exists for a shift slot that isn't filled
              // we used to just have shift as null
              if( col.slot_date){
                return <td className={col.background_colour}
                    onClick={this.cellClick.bind( this, col)} key={ndx}></td>;
              } else {
                const title = moment(col.start_time).format('HH:mm').concat('-',
                              moment(col.end_time).format('HH:mm'),
                              '\n',
                              col.notes || '');
                return (
                  <td className={col.background_colour}
                    onClick={this.cellClick.bind(this, col)}
                    key={ndx}
                    title={title}
                  >
                    {col.client.initials}
                  </td>
                );
              }
            } else {
              return <td key={ndx} ></td>;
            }
        })}</tr>
    );
  }
}
