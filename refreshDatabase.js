var mongo=require('./mongo.js');
var getData=require('./GetData.js')
var crawl=require('./crawl.js');
var db;
var websiteListing=[];
mongo.MongoWrapper(function(mongoCon)
{
    db=mongoCon;
})
fs.readFileSync('q.txt',function(err,res)
{
    if(err)throw err
    else
    {
        res=JSON.parse(res);
        for(var i in res)
        {
            websiteListing[res[i].websitename]=res[i];
        }
    }
})
function startRefreshing()
{
   
    var collection=db.collection('oglasi');
    collection.find().toArray(function(err,res)
    {
        if(err)console.log(err);
        else 
        {
            async.eachSeries(res,function(collectionForScraping,done)
            {
                refreshCollection(collectionForScraping,function()
                {
                    done();
                })
            },end);
        }
    })

}
var numberToProcess=20;
function refreshCollection(collection,callback)
{
    db.find().toArray(function(err,allAdverts)
    {
        if(err)throw err
        else
        {
            var skipCoef=0;
            function recurse()
            {
                var arrayPart=returnFewElemsFromArray(allAdverts,skipCoef);
                if(arrayPart.length<numberToProcess)
                {
                    console.log('End reached');
                    skipCoef=-1;
                }
                else skipCoef++;
                processFewAdverts(arrayPart,function()
                {
                    if(skipCoef==-1)return;
                    else recurse();
                });
            }
            
            
        }
    })
}

function processFewAdverts(advertsToProcess,callback)
{
        async.each(advertsToProcess,function(advert,finish)
        {
            var qTextVersion=websiteListing[advert.websitename];
            var phantomSupport=websiteListing[advert.websitename].phantomSupport
            
            
            getData.GetRawData(advert.link,phantomSupport,qTextVersion.websitename,1,function(err,resp,body)
            {
                if(resp.statusCode==200)
                {
                    console.log('GOOD ONE:'+advert.link);
                }
                else
                {
                    console.log('BAD ONE:'+advert.link);
                }
            })
            
        },function()
        {
            callback();
        }) 
}

function returnFewElemsFromArray(array,skipCoef)
{
    var arrToReturn=[];
    var startNum=skipCoef*numberToProcess;
    var i=startNum;
    for(;i<startNum+numberToProcess;i++)
    {
        arrToReturn.push(array[i]);
    }
    
    return arrToReturn;
}
function end()
{
    console.log("WHole DB has been refreshed");
}