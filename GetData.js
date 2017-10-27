var exec=require('child_process').exec;
var request=require('request');
var fs=require('fs');
var DEBUG="None";
var MAX_REQUEST_RETRY=3;
var MIN_CHARS_RESPONSE=100;
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj)
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    return copy;
}

var hashesOfEveryWebsite=[];
var listOfNames=[];
//MOZDA POSTOJI PROBLEM AKO REQUEST KOJI DODJE KASNIJE 
var alertPointer=0;
var svePointer=0;

function debug()
{
	console.log(hashesOfEveryWebsite);
}
if(DEBUG=="STANDARD_DEBUG")setInterval(debug,6000)
var GetRawData=function(url,phantomSupport,nameOfRemoteWebsite,uzmiSve,callback)
{
		if(!nameOfRemoteWebsite){console.log('GetRawData no parameter name');}
	
		if(!hashesOfEveryWebsite[nameOfRemoteWebsite])
		{
			hashesOfEveryWebsite[nameOfRemoteWebsite]={};
			hashesOfEveryWebsite[nameOfRemoteWebsite].arrayForAlerts=[];
			hashesOfEveryWebsite[nameOfRemoteWebsite].arrayForTakingAll=[];
			hashesOfEveryWebsite[nameOfRemoteWebsite].lastSent=0			
		}
		var object={};
		
		object.url=url;
		object.callback=callback;
		object.phantomSupport=phantomSupport;
		
		if(uzmiSve==0)
		{
			hashesOfEveryWebsite[nameOfRemoteWebsite].arrayForAlerts.push(clone(object));
		}
		else
		{
			hashesOfEveryWebsite[nameOfRemoteWebsite].arrayForTakingAll.push(clone(object));
		}
}
function timeControlledRequests()
{
	//console.log(hashesOfEveryWebsite);
	for(var i in hashesOfEveryWebsite)
	{
		//console.log(hashesOfEveryWebsite[i].lastSent+ ' duzina alert niza'+hashesOfEveryWebsite[i].arrayForAlerts.length+' duzina uzmiSve niza:'+hashesOfEveryWebsite[i].arrayForTakingAll.length);
		if(hashesOfEveryWebsite[i].lastSent==4)
		{
			if(hashesOfEveryWebsite[i].arrayForAlerts.length)
			{
				//alreadySent=1;
				console.log("sent to alerts "+i)
				hashesOfEveryWebsite[i].lastSent++;
				var temp=clone(hashesOfEveryWebsite[i].arrayForAlerts[0]);
				hashesOfEveryWebsite[i].arrayForAlerts.shift();
				takeRequest(temp);
				
			}
			else
			{
				if(hashesOfEveryWebsite[i].arrayForTakingAll.length)
				{
					console.log("sent to getall "+i)
					var temp=clone(hashesOfEveryWebsite[i].arrayForTakingAll[0]);
					hashesOfEveryWebsite[i].arrayForTakingAll.shift();
					takeRequest(temp);
					
				}
			}
			
		}
		else if((hashesOfEveryWebsite[i].lastSent<4))
		{
			if(hashesOfEveryWebsite[i].arrayForTakingAll.length)
			{
				console.log("sent to getall "+i)
				//console.log("sent to ");console.log(hashesOfEveryWebsite[i].arrayForTakingAll[0])
				hashesOfEveryWebsite[i].lastSent++;
				var temp=clone(hashesOfEveryWebsite[i].arrayForTakingAll[0]);
				hashesOfEveryWebsite[i].arrayForTakingAll.shift();
				takeRequest(temp);
				
			}
			else
			{
				if(hashesOfEveryWebsite[i].arrayForAlerts.length)
				{
					console.log("sent to alerts "+i)
					var temp=clone(hashesOfEveryWebsite[i].arrayForAlerts[0]);
					hashesOfEveryWebsite[i].arrayForAlerts.shift();
					takeRequest(temp);
					
				}
			}
		}
		hashesOfEveryWebsite[i].lastSent%=5;
		
	}
}
var balance=0;
function takeRequest(requestInfo)
{
	//console.log(requestInfo);
	if(!requestInfo)console.log("nema request info");
	
	//process.exit();
	//balance++;
	if(requestInfo.phantomSupport=='true')
		{
			//console.log("Phantom pozvan!")
			regulatePhantomJSCall(requestInfo,1);
			
		}
		else
		{
			//console.log("request pozvan!")
			regulateRequestCall(requestInfo,1);	
		}
}
function regulatePhantomJSCall(requestInfo,countOfCalls)
{
	if((countOfCalls % MAX_REQUEST_RETRY)==0)
	{
		requestInfo.callback(null,null,-1);
	}
	else
	{
		exec('phantomjs --ssl-protocol=any --ignore-ssl-errors=true ./phantom.js '+requestInfo.url,{maxBuffer:1024*10000},function(err,stdout,stderr)
		{
			if((!stdout)||(stdout.length<=5000))
			{
				if((countOfCalls % MAX_REQUEST_RETRY)==0)
					{
						console.log("***PHANTOMJS will delay for 60 seconds on: "+requestInfo.url+" because returned NO data***");
						setTimeout(function()
						{
							regulatePhantomJSCall(requestInfo,countOfCalls+1);
						},1000*60);
						return;
					}
					else
					{
						console.log("Request returned INVALID webpage for "+countOfCalls+" times "+"on object:");
						console.log(JSON.stringify(requestInfo));
						console.log("Sending request again");
						regulatePhantomJSCall(requestInfo,countOfCalls+1);	
					}	
			}
			else
			{
				//balance--;
				//console.log("BALANCE:"+balance);
				requestInfo.callback(err,stderr,stdout);
			}
		})
	}

}
function regulateRequestCall(requestInfo,countOfCalls)
{
	if((countOfCalls % MAX_REQUEST_RETRY)==0)
	{
		requestInfo.callback(null,null,-1);
	}
	else
	{
		request(requestInfo.url,function(err,resp,body)
		{
			if((!body)||(body.length<MIN_CHARS_RESPONSE))
			{
				if((countOfCalls % MAX_REQUEST_RETRY)==0)
				{
					console.log("***Request will delay for 60 seconds on: "+requestInfo.url+" because returned NO data***");
					setTimeout(function()
					{
						regulateRequestCall(requestInfo,countOfCalls+1);
					},1000*60);
					return;
				}
				else
				{
					console.log("Request returned INVALID webpage for "+countOfCalls+" times "+"on object:");
					console.log(JSON.stringify(requestInfo));
					console.log("Sending request again");
					regulateRequestCall(requestInfo,countOfCalls+1);	
				}	
			}
			else
			{
				requestInfo.callback(err,resp,body);
			}
		})
	}
}
setInterval(timeControlledRequests,2500);
module.exports={GetRawData};