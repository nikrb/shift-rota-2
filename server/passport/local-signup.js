const User = require( 'mongoose').model('User');
const PassportLocalStrategy = require( 'passport-local').Strategy;

module.exports = new PassportLocalStrategy( {
  usernameField: "email",
  passwordField: "password",
  session: false,
  passReqToCallback: true
}, (req, email, password, done) => {
  const names = req.body.name.split(' ');
  const initials = names.reduce(
    (acc,cur) => acc.concat(cur.charAt().toUpperCase()), '');
  const userData = {
    email: email.trim(),
    password: password.trim(),
    name: req.body.name.trim(),
    initials,
  };
  console.log('new user:', userData);
  const newUser = new User( userData);
  newUser.save( (err) => {
    if( err) { return done(err);}
    return done(null);
  });
});
