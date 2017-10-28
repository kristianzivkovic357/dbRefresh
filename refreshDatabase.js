var mongo=require('./mongo.js');
var getData=require('./GetData.js')
var crawl=require('./crawl.js');
var fs=require('fs')
var async=require('async')
var ObjectID = require('mongodb').ObjectID
var db;
var websiteListing=[];
mongo.MongoWrapper(function(mongoCon)
{
    db=mongoCon;
    fs.readFile('q.txt',"utf8",function(err,res)
    {
        if(err)throw err
        else
        {

            res=res.substr(1);
            res=res.split("&&||");
            
            for(var i in res)
            {
                res[i]=JSON.parse(res[i]);
                websiteListing[res[i].websitename]=res[i];
            }
            startRefreshing();//start of program
            //processFewAdverts([{'websitename':'halooglasi','link':'http://www.halooglasi.com/nekretnine/prodaja-zemljista/na-prodaju-plac-od-112-ari-u-pancevu/5425487381592','phantomSupport':'true'}]);
        }
    })
   
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
                refreshCollection(collectionForScraping.ime,function()
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
    var dbCollection=db.collection(collection);
    console.log('request started for collection:'+collection);
    dbCollection.find(/*{websitename:"nekretnine"}*/).toArray(function(err,allAdverts)
    {
        console.log('adverts retrived:'+allAdverts.length)
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
                processFewAdverts(arrayPart,dbCollection,function()
                {
                    if(skipCoef==-1)return;
                    else recurse();
                });
            }
            recurse();
            
            
        }
    })
}

function processFewAdverts(advertsToProcess,dbCollection,callback)
{
    console.log('few adverts started to process:'+advertsToProcess.length)
        async.each(advertsToProcess,function(advert,finish)
        {
            var qTextVersion=websiteListing[advert.websitename];
            var phantomSupport=websiteListing[advert.websitename].phantomSupport
            
            if(advert.websitename=='halooglasi')
                {
                    if(advert.link.indexOf('http://')!=-1)
                    {
                        //console.log('AAAAAA')
                        var link=advert.link.replace('http://','');
                        advert.link='https://'+link;
                        //console.log(advert.link)
                        //return
                    }
                    

                }
                //console.log(phantomSupport)
            getData.GetRawData(advert.link,phantomSupport,qTextVersion.websitename,1,function(err,resp,body)
            {
                if(phantomSupport=='true')
                {   
                    
                    //console.log(body)
                    body=JSON.parse(body)
                    //sconsole.log(body.statusCode);
                    if(body.statusCode==200)
                    {
                        console.log('GOOD ONE:'+advert.link);
                    }
                    else
                    {
                        console.log('BAD ONE:'+advert.link);
                        removeAdvertFromDatabase(dbCollection,advert);
                    }
                }
                else
                {
                    if(resp.statusCode==200)
                    {
                        console.log('GOOD ONE:'+advert.link);
                    }
                    else
                    {
                        console.log('BAD ONE:'+advert.link);
                        removeAdvertFromDatabase(dbCollection,advert);
                    }
                }
                
                finish();
            })
            
        },function()
        {
            if(callback)callback();
            else return 0;
        }) 
}
function removeAdvertFromDatabase(dbCollection,advert)
{
    dbCollection.remove({_id:new ObjectID(advert._id)},function(err,res)
    {
        if(err)console.log(err);
        console.log(res.result);
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
//startRefreshing();