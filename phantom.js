var page = require('webpage').create();
var system = require('system');
var args = system.args;
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';
page.settings.loadImages=false;
//page.settings.resourceTimeout=15000;
//console.log('KRENULI SMOOOO');
//console.log(args[1]);
if(!args[1])console.log('ne valja komandna linija');
block_urls = ['google.com','gstatic.com', 'adocean.pl','analytics.com','dotmetrics.net','googleapis.com','httpool.com', 'gemius.pl', 'twitter.com', 'facebook.net', 'facebook.com', 'planplus.rs'];

page.onResourceRequested = function(requestData, request)
{
   	for(i in block_urls)
   	{
   		if(requestData.url.indexOf(block_urls[i])!=-1)
   		{
   			//console.log('Aborted:'+requestData.url)
   			request.abort();
   		}
   	}
}
//console.log(args[1])
var statusCode;
var finalObj={};
page.onResourceReceived=function(resource)
{
	if(resource.url===args[1])
	{
		//console.log(resource.status);
		finalObj.statusCode=resource.status;
	}
}
page.onUrlChanged = function(targetUrl) {
	//console.log('New URL: ' + targetUrl);
	finalObj.lastUrl=targetUrl;
  };
page.onLoadFinished = function(status) 
{
	
	finalObj.html=page.content;
	console.log(JSON.stringify(finalObj));
	phantom.exit();
}
page.onError = function(msg, trace) {
    /*var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }*/
    // uncomment to log into the console 
    // console.error(msgStack.join('\n'));
};
page.open(args[1],function()
{
	//console.log(page.content)
});

