import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

export default class SignupForm extends React.Component {
  static propTypes = {
    onSubmit: PropTypes.func,
    onChange: PropTypes.func,
    user: PropTypes.object,
    errors: PropTypes.object
  };
  render = () => {
    const {onSubmit,onChange,user,errors} = this.props;
    return (
      <div className="container" >
        <form action="/" onSubmit={onSubmit} >
          <h2>Sign Up</h2>
          {errors.summary && <p className="error-message">{errors.summary}</p>}
          <label>Name
            <div className="error-wrap">
              {errors.name && <p className="error-field">{errors.name}</p>}
              <input type="text" name="name"
                value={user.name} onChange={onChange} />
            </div>
          </label>
          <label>Email
            <div className="error-wrap">
              {errors.email && <div className="error-field">{errors.email}</div>}
              <input type="text" name="email"
                value={user.email} onChange={onChange} />
            </div>
          </label>
          <label>Password
            <div className="error-wrap">
              {errors.password && <p className="error-field">{errors.password}</p>}
              <input type="password" name="password"
                value={user.password} onChange={onChange} />
            </div>
          </label>
          <div style={{margin:"10px"}}>
            <button type="submit" >Create New Account</button>
          </div>
          <div style={{fontSize:"12px",textAlign:"center"}}>
            Already have an account? <Link to={"/login"}>Log in</Link>
          </div>
        </form>
      </div>
    );
  };
}
