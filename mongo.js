var mongodb = require('mongodb');

var database;
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
//var url = 'mongodb://kristian.zivkovic:123@ds123050.mlab.com:23050/advertising';
var url = 'mongodb://homehunter357:devteam357@173.249.1.30:27017/advertising';
//var url = 'mongodb://localhost/advertising'
var MongoWrapper=function(callback)
{
	MongoClient.connect(url, function (err, db) {
	  if (err) {
	    console.log('Unable to connect to the mongoDB server. Error:', err);
	  } else {
	    
	    console.log('Connection established to', url);
	    callback(db);
	  	
	    
	    //db.close(); BITNO
	  }
	});
}
var ObjectId=mongodb.ObjectId;
module.exports={MongoWrapper,ObjectId}
