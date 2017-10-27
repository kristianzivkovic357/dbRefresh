
var request=require('request');
var cheerio=require('cheerio');
var GetData=require('./GetData')
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj)
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    return copy;
}
var FindData=function (ch,th,str) 
{
    var arrOfCom=[];

    arrOfCom=str.split('.');
    //console.log(arrOfCom)
    for(var i=0;i<arrOfCom.length;i++) 
    {
        var otv=arrOfCom[i].indexOf('(');
        var zatv=arrOfCom[i].indexOf(')');
        //if(!th){console.log('Nije pronadjena putanja');return -1;}
        
        if(arrOfCom[i].indexOf('eq(')!=-1) 
        {
            var string=arrOfCom[i].substr(otv+1,zatv-1);
            string=string.substr(0,string.length-1);
            th=ch(th).eq(Number(string));

            continue;
        }
        else if(arrOfCom[i].indexOf('children(')!=-1) 
        {//console.log('1');
            th=ch(th).children();
        }
        else if(arrOfCom[i].indexOf('attr(')!=-1) 
        {//console.log('2');
            var string=arrOfCom[i].substr(otv+1,arrOfCom[i].length-1);
            string=string.substr(0,string.length-1);
            th=ch(th).attr(string);
            //if(typeof th==='undefined')return "012";//Ovo je uvedeno u trenutku kad smo ubacili nekretnine.rs TREBA RAZMOTRITI PRI DODAVANJU DRUGIH SAJTOVA
            //return th;ovde je bilo
        }
        else if(arrOfCom[i].indexOf('text(')!=-1) 
        {//console.log('3');
            if (typeof th != 'string') { th=ch(th).text(); }
            //else console.log("pre text i q.txt je string a treba objekat")
            //return th;ovde je bilo
        }
        else if(arrOfCom[i].indexOf('returnStringAfterChar(')!=-1)
        {
            if(typeof th !="string")
            {
                console.log("Nepravilna upotreba returnStringAfterChar");
            }
            else
            {
                th=th.substr(th.indexOf(arrOfCom[i][otv+1])+1);
                
            }
        }
        else if(arrOfCom[i].indexOf('returnStringBeforeValues(')!=-1)
            {
                if(typeof th !="string")
                {
                    console.log("Nepravilna upotreba returnStringBefore");
                }
                else
                {
                    var valuesToFind=arrOfCom[i].substr(otv+1,zatv-(otv+1));
                   valuesToFind=JSON.parse(valuesToFind);
                   var minIndex=100000;
                   for(var j in valuesToFind)
                    {
                        
                        var val=th.indexOf(valuesToFind[j]);
                        //console.log(val)
                        if((minIndex>val)&&(val!=-1))
                        {
                            minIndex=val;
                        }
                    }
                    var solution;
                   // console.log(minIndex);
                    if(minIndex!=100000)
                    {
                        th=th.substr(0,minIndex);
                    }
                    //console.log(th);
                    
                    
                    //process.exit();
                    
                }
            }
        else if(arrOfCom[i].indexOf('split(')!=-1) 
        {//console.log('4');
            var string=arrOfCom[i].substr(otv+1,arrOfCom[i].length-2);
            string=string.substr(0,string.length-1);
            string = string.split(' ');
            th = ch(th).text().split(string[0])[string[1]];
            continue;
        }
        else if(arrOfCom[i].indexOf('kk(')!=-1) 
        {//console.log('5');
            var string=arrOfCom[i].substr(otv+1,arrOfCom[i].length-2);
            string=string.substr(0,string.length-1);
            if (typeof th != 'string') 
            { 
                th = ch(th).text().substr(0,ch(th).text().indexOf(string)-1)
            }
            else {
                //console.log(th.indexOf(string));
                th = th.substr(0,th.indexOf(string)-1);
            }
            continue;
        }
        else if(arrOfCom[i].indexOf('id(')!=-1)
        {//console.log('6');
            var string=arrOfCom[i].substr(otv+1,arrOfCom[i].length-2);
            string=string.substr(0,string.length-1);
            th=ch('#'+string);
            continue;
        }
        else if(arrOfCom[i].indexOf('class(')!=-1)
        {
            //console.log('ddqwdqd');

          var string=arrOfCom[i].substr(otv+1,arrOfCom[i].length-2);
          
          string=string.substr(0,string.length-1)
          string =string.replace(/[' ']/g,".");
          string='.'+string;
    
            th=ch(string);
            continue;
        }
        else if(arrOfCom[i].indexOf('html(')!=-1)
        {
            var th = ch(th).html();
            if(th)
            {
                th=th.toString('utf-8');
            }
            
            //return b;//RADI SAMO AKO JE ZADNJI U x.txtovde je bilo
        }

        else 
        {
            console.log('Funckija FindData dobija parametar koji ne valja!');
        }
    }
    if(typeof th =='string')
    {
        return th;
    }
    return ch(th);
}
function indexOfReturnAll(a,b)//look b in a
{
    var indexes=[];
    for(var i=0;i+b.length<a.length;i++)
    {
        var isSubstr=1;
        for(var j=0;j<b.length;j++)
        {
            if(a[i+j]!=b[j]){isSubstr=0;break;}
        }
        if(isSubstr)
        {
            indexes.push(i);
        }
    }
    return indexes;

}
function modify(string,obj)
{
    if(obj.websitename=='halooglasi')
    {
        string=string.replace("/m/","/l/");
    }
    if(string.indexOf('http')==-1)
    {
        string='http://'+obj.domain+string;
    }
    return string;
}
function getImagesFromDiv(objectToFill,$)
{

        $= FindData($,null,objectToFill.images);
         objectToFill.images=[];
        function domRecursion($)
        {
            var p=$.children();
            var len=p.length;

            if(!len)
            {
                if($.attr('src'))
                {
                    var modified=modify($.attr('src'),objectToFill);
                    objectToFill.images.push(modified);
                }
                return;
            }
            for(var i=0;i<len;i++)
            {
                domRecursion(p.eq(i));
            }
        }
        domRecursion($);
}
var find=function(a,uzmiSve,callback)
{	
    if(!a.link){console.log('NEMA LINKA NIDJE');return -1;}

    GetData.GetRawData(a.link,a.phantomSupport,a.websitename,uzmiSve,function(err,resp,body)
    {
        if(body.length>=5000)
            {
            if(err)console.log(err);
           // console.log(a.binders);
            var $=cheerio.load(body,{decodeEntities:false});
            var obj={};
            obj.cena=a.cena;obj.link=a.link; obj.kvadratura=a.kvadratura;obj.slika=a.slika;obj.websitename=a.websitename;obj.type=a.type;obj.nacinkupovine=a.nacinkupovine;obj.naslov=a.naslov;obj.datum=a.datum;obj.datumSetup=a.datumSetup;obj.lokacijaOptions=a.lokacijaOptions;obj.doesntHaveImage=a.doesntHaveImage;
            for(var i in a.pickInAdvert)
            {
                /**
                 * collecting data for every advert by getting the page of the advert itself(sending request) and then
                 */
                obj[i]=FindData($,null,a.pickInAdvert[i]).replace(new RegExp(/\s\s+|&nbsp;/g), ' ').trim();
            }

            var html="";
            for(www in a.data)
            {
                html+=FindData($,null,a.data[www]);
            }
           if(a.images)
           { 
                getImagesFromDiv(a,$);
                obj.images=a.images;
           }
            var formed='';
            var NeDodaj=0;
            var comment=0,script=0;
            formed.trim();
                var dontAdd=0;//console.log(html)
                 formed = formed.replace(/\s\s+/g, ' ');
                for(var i=0;i<html.length;i++)
                {
                   if(html[i]=='<')
                   {

                        if((formed[formed.length-1]!=' ')&&(formed[formed.length-1]!='^'))formed+='^';
                        dontAdd=1;
                   }
                   else if(html[i]=='>')
                   {
                        dontAdd=0;
                        continue;
                   }
                   if(!dontAdd)formed+=html[i];//CONTENT
                }
                //console.log(formed);
                    for(var i in a.binders)
                    {
                        formed=formed.replace(/&nbsp;/gi,' ');
                        if(a.binders[i][a.binders[i].length-1]=='*')
                        {
                           // console.log(a.binders[i]+"   "+a.binders[i].substr(0,a.binders[i].length-1));
                            //a.binders[i]=a.binders[i].substr(0,a.binders[i].length-1);
                            //console.log('USO');
                            formed=formed.replace(i,a.binders[i].substr(0,a.binders[i].length-1));
                        }
                        else 
                        {
                            formed=formed.replace(i,a.binders[i]);
                        }
                    }
                   
                    for(var i in a.binders)
                    {
                        var returnResultInArray=0;
                        if(a.binders[i][a.binders[i].length-1]=='*')//gledam da li je poslednji karakter zvezdica
                        {
                            returnResultInArray=1;
                        }
                        var withoutSuffix=a.binders[i].replace('!@#','');
                        withoutSuffix=withoutSuffix.replace('*','');
                        var st=indexOfReturnAll(formed,a.binders[i].substr(0,a.binders[i].length-1));//zasto substr?

                        for(var q in st)// za svaki occurence bindera u textu
                        {
                            var start=st[q];
                            if(returnResultInArray)obj[withoutSuffix]=[];
                            else obj[withoutSuffix]='';
                            //console.log(st);
                            //process.exit();
                            //for (var start in st)
                            //{
                                    /*if(!obj[withoutSuffix])*/
                                
                                // console.log(obj);console.log(withoutSuffix);//process.exit();
                                    start=start+a.binders[i].length;
                                    var singleData='';
                                    for(;(formed.substr(start,3)!='!@#')&&(start<formed.length);start++)
                                        {
                                            if(formed[start]!='\r'&&formed[start]!='\r\n'&&formed[start]!='\n'&&formed[start]!='\t')
                                            {
                                                if(formed[start]!='^')singleData+=formed[start];
                                                if((formed[start]=='^')||(start>=formed.length-1))
                                                {
                                                    if(singleData.trim().length>0)
                                                    {
                                                        //obj[withoutSuffix]=[];
                                                        if(returnResultInArray==1)
                                                        {
                                                            obj[withoutSuffix].push(singleData);
                                                        }
                                                        else
                                                        {
                                                            obj[withoutSuffix]+=singleData;
                                                        }
                                                    }
                                                    singleData='';
                                                }
                                                
                                            }

                                        }

                        }
                    }
                
           //}
          
           callback(obj)
        }
    else 
        {
                console.log('PHANTOM KRENUO PRERANO');
                callback(-1);
        }
    })
}

module.exports={find,FindData,indexOfReturnAll};