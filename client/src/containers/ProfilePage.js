import React from 'react';
import Auth from '../modules/Auth';

export default class ProfilePage extends React.Component {
  render = () => {
    const name = Auth.getUsername();
    const email = Auth.getEmail();
    // temporary display page, just center this
    const centre = { textAlign: "center"};
    return (
      <div style={centre}>
        <h1>Profile</h1>
        <div>Name: {name}</div>
        <div>Email: {email}</div>
      </div>
    );
  };
}
