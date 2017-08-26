import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';

export default class LoginForm extends React.Component {
  static propTypes = {
    onSubmit: PropTypes.func,
    onChange: PropTypes.func,
    user: PropTypes.object,
    errors: PropTypes.object
  };
  render = () => {
    const {onSubmit,onChange,user,errors} = this.props;
    // TODO: show signup success
    return (
      <div className="container" >
        <form action="/" onSubmit={onSubmit} >
          <h2>Login</h2>
          {errors.summary && <p className="error-message">{errors.summary}</p>}
          <label>Email
            <input type="text" name="email"
              value={user.email} onChange={onChange} />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </label>
          <label>Password
            <input type="password" name="password"
              value={user.password} onChange={onChange} />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </label>
          <div style={{margin:"10px"}}>
            <button type="submit" >Login</button>
          </div>
          <div style={{fontSize:"12px",textAlign:"center"}}>
            Dont have an account? <Link to={"/signup"}>Sign Up</Link>
          </div>
        </form>
      </div>
    );
  };
}
