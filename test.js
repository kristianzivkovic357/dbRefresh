var exec=require('child_process').exec;
exec('phantomjs --ssl-protocol=any --ignore-ssl-errors=true ./phantom.js https://www.halooglasi.com/nekretnine/prodaja-zemljista/hitno-plac-bezanija-novi-beograd-cena-dogovor/5425462793750',{maxBuffer:1024*1000},function(err,stdout,stderr)
{
    console.log(JSON.parse(stdout).statusCode)

})