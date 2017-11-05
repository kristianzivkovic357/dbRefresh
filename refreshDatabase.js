var mongo=require('./mongo.js');
var getData=require('./GetData.js')
var crawl=require('./crawl.js');
var fs=require('fs')
var async=require('async')
var ObjectID = require('mongodb').ObjectID
var db;
var websiteListing=[];
var debugObj={};


mongo.MongoWrapper(function(mongoCon)
{
    db=mongoCon;
    fs.readFile('q.txt',"utf8",function(err,res)
    {
        if(err)throw err
        else
        {
            fs.readFile('previousState.txt','utf8',function(err,text)
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
                    text=JSON.parse(text);
                    var finished=text.numberOfFinishedInCollection;
                    var collection=text.collection;
                    console.log(finished);
                    console.log(collection)
                    //removeExpiredAdsFromAlerts(['https://www.4zida.rs/prodaja/stanovi/novi-sad/oglas/novo-naselje/59f42b1270baeb3f433481e4','https://www.4zida.rs/prodaja/stanovi/beograd/oglas/jug-bogdanova/59f3f30870baeb2bbe320784']);
                    if((collection)&&(finished!=undefined))startRefreshing(collection,finished);//start of program
                    else startRefreshing();
                        //processFewAdverts([{'websitename':'halooglasi','link':'https://www.halooglasi.com/nekretnine/izdavanje-stanova/novi-beograd---stari-merkator-id22871/54256387157','phantomSupport':'true'}],[]);
                    //limitMatchingsOnNDays()
                    //refreshCollection('Izdavanjestan')
                }
                
            })

        }
    })
   
})
function writeDebug()
{
    console.log(JSON.stringify(debugObj));
}
setInterval(writeDebug,15000)

function startRefreshing(collectionToStart=0,numberOfFinishedInCollection=undefined)
{
   
    var collection=db.collection('oglasi');
    collection.find().toArray(function(err,res)
    {
        if(err)console.log(err);
        else 
        {
            dontAskAnymore=0;
            //console.log(res);process.exit();
            async.eachSeries(res,function(collectionForScraping,done)
            {
                //console.log(collectionToStart,numberOfFinishedInCollection)
                if((collectionToStart)&&(numberOfFinishedInCollection!=undefined)&&(!dontAskAnymore))
                {
                    if(collectionForScraping.ime!=collectionToStart)return done();
                    else
                    {
                        dontAskAnymore=1;
                    }
                }
                debugObj.collection=collectionForScraping.ime;
                debugObj.numberOfProcessedAds=0;
                debugObj.goodAds=0;
                debugObj.badAds=0;
                refreshCollection(collectionForScraping.ime,numberOfFinishedInCollection,function()
                {
                    numberOfFinishedInCollection=0;
                    done();
                })
            },end);
        }
    })

}
var numberToProcess=20;
function refreshCollection(collection=0,numberOfFinishedInCollection=0,callback)
{
    var listOfExpiredIds=[];
    var dbCollection=db.collection(collection);
    console.log('request started for collection:'+collection);
    dbCollection.find(/*{websitename:"halooglasi"}*/).skip(numberOfFinishedInCollection*numberToProcess).sort({date:-1}).toArray(function(err,allAdverts)
    {
        //console.log(allAdverts[0].link)
        console.log('adverts retrived:'+allAdverts.length)
        debugObj.totalAdNumber=allAdverts.length;
        
        if(err)throw err
        else
        {
            var skipCoef=numberOfFinishedInCollection;
            function recurse()
            {
                var arrayPart=returnFewElemsFromArray(allAdverts);
                if(arrayPart.length<numberToProcess)
                {
                    console.log('End reached');
                    skipCoef=-1;
                }
                else skipCoef++;
                processFewAdverts(arrayPart,dbCollection,listOfExpiredIds,function()
                {
                    var previousStateObj={};
                    previousStateObj.collection=collection;
                    previousStateObj.numberOfFinishedInCollection= (skipCoef!=-1 ?skipCoef:0);
                    writeToFile('previousState.txt',JSON.stringify(previousStateObj));

                    if(skipCoef==-1)
                    {
                        skippingInArray=0;//used i  function returnFewAdsFromArray to skip in array
                        removeExpiredAdsFromAlerts(listOfExpiredIds,function()
                        {
                            //a
                            callback();
                        });
                        
                    }
                    else recurse();
                });
            }
            recurse();
            
            
        }
    })
}

function processFewAdverts(advertsToProcess,dbCollection,listOfExpiredIds,callback)
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
                    //if((body.lastUrl!=advert.link))console.log('NEW ADDRESS:'+body.lastUrl);
                    //if((body.statusCode!=200))console.log('STATUS CODE: '+body.statusCode)
                    if(body.lastUrl!='https://www.halooglasi.com/404?error=1')
                    {
                        debugObj.numberOfProcessedAds++;
                        debugObj.goodAds++;
                        appendToFile('goodAds.txt',advert.link);
                        console.log('GOOD ONE:'+advert.link);
                    }
                    else
                    {
                        debugObj.numberOfProcessedAds++;
                        debugObj.badAds++;
                        appendToFile('badAds.txt',advert.link);
                        console.log('BAD ONE:'+advert.link);
                        listOfExpiredIds.push(advert.link);
                        removeAdvertFromDatabase(dbCollection,advert);
                    }
                }
                else
                {
                    if((resp.statusCode==200)&&(resp.request.uri.href==advert.link))
                    {
                        debugObj.numberOfProcessedAds++;
                        debugObj.goodAds++;
                        appendToFile('goodAds.txt',advert.link);
                        console.log('GOOD ONE:'+advert.link);
                    }
                    else
                    {
                        debugObj.numberOfProcessedAds++;
                        debugObj.badAds++;
                        appendToFile('badAds.txt',advert.link);
                        console.log('BAD ONE:'+advert.link);
                        listOfExpiredIds.push(advert.link);
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
function removeExpiredAdsFromAlerts(listOfExpiredLinks,callback)
{
    console.log(listOfExpiredLinks);
    console.log('started ti process expired alerts')
    var users=db.collection('users');
    users.find({},{_id:0,id:1}).toArray(function(err,res)
    {
        async.eachSeries(res,function(matchingCollection,done)
        {
            try
            {
                var collection=db.collection(matchingCollection.id.toString());
                collection.remove({idogl:{$in:listOfExpiredLinks}},function(err,res)
                {
                    if(err)console.log(err);
                    else console.log(res.result);
                    console.log('collection '+matchingCollection.id+' is done');
                    done();
                   
                })
            }
            catch(e)
            {
                console.log(e);
            }
            

        },function()
        {
            callback();
        })
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
var skippingInArray=0;
function returnFewElemsFromArray(array)
{
    var arrToReturn=[];
    var startNum=skippingInArray*numberToProcess;
    var i=startNum;
    skippingInArray++;
    for(;(i<startNum+numberToProcess)&&(i<array.length);i++)
    {
        //console.log(i)
        arrToReturn.push(array[i]);
    }
    
    return arrToReturn;
}
function end()
{
    console.log("WHole DB has been refreshed");
}
function appendToFile(file,content,callback)
{
    fs.appendFile(file,content,function(err,resp)
    {
        if(err)console.log(err)
        if(callback)callback();
    })
}
function writeToFile(file,content,callback)
{
    fs.writeFile(file,content,function(err,resp)
    {
        if(err)console.log(err);
        if(callback)callback();
    })
}

//startRefreshing();