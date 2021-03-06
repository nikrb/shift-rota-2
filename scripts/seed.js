require( 'dotenv').config();
var MongoClient = require('mongodb').MongoClient;
var url = process.env.dbUri;
console.log('mongo:', process.env.dbUri);
MongoClient.connect(url, function(err, db) {
  if( err){
    console.error( "mongo connect error:", err);
    process.exit(1);
  }
  db.collection('users').insertMany([
    // { name: "Nickolas Scott", initials: "NS", email:"nik_rb@yahoo.com", role:"worker" },
    { name: "Jeffrey Wilson",initials: "JW", email:"jw@noemail", role:"client" },
    { name: "Stephen Morley",initials: "SM", email:"sm@noemail", role:"client" },
    { name : "Personal Nik", initials : "PERS", email: "none@email.com", role : "client" },
  ]).then(results => {
    console.log(results);
    db.close();
    process.exit(1);
  });
});
