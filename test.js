var exec=require('child_process').exec;
var request=require('request');
var fs=require('fs');
exec('phantomjs --ssl-protocol=any --ignore-ssl-errors=true ./phantom.js '+'https://www.halooglasi.com/nekretnine/izdavanje-stanova/crveni-krst-lux-novogradnja-id-9593/55620497998',{maxBuffer:1024*10000},function(err,stdout,stderr)
{
    var stdout=JSON.parse(stdout);
    console.log(stdout.lastUrl);
    console.log(stdout.statusCode);
})