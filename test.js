var mongo=require('./mongo');

mongo.MongoWrapper(function(db)
{
    var collection=db.collection('users');
    collection.find().limit(1000).toArray(function(err,res)
    {
        console.log(res.length)
    })
})