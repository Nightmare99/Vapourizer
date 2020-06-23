import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import mongoose from 'mongoose';
import gridfs from 'gridfs-stream';

dotenv.config();
mongoose.connect(process.env.MONGO_URL, { 
    useNewUrlParser: true, 
    useFindAndModify: false,
    useUnifiedTopology: true 
});
mongoose.Promise = global.Promise;
gridfs.mongo = mongoose.mongo;
var connection = mongoose.connection;

function sleep(ms) { // Steam servers are paranoid about DDoS, so we wait 10s before each new request to their API
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}  

var appid = Number(process.argv[2]); // App ID of the target game. CSG0 - 730, DotA 2 - 570, PUBG - 578080. You will only have to change here.
var gameDict = {
    730: 'CSGO',
    570: 'DotA2',
    578080: 'PUBG'
}; // Add any other games here. Format - appid: name

async function getItemNames() {
    var itemNames = [];
    var start = 100;
    var response = await axios.get('https://steamcommunity.com/market/search/render/?start=0&search_descriptions=0&sort_column=default&sort_dir=desc&appid=' + appid + '&norender=1&count=100');
    var results = response.data.results;
    var total = response.data.total_count;
    for (var i of results)
        itemNames.push(i.name)
    while (itemNames.length < total) {
        var response = await axios.get('https://steamcommunity.com/market/search/render/?start=' + start + '&search_descriptions=0&sort_column=default&sort_dir=desc&appid=' + appid + '&norender=1&count=100')
        var results = response.data.results;
        for (var i of results) {
            itemNames.push(i.hash_name);
        }
        start += 100;
        await sleep(10000);
    }
    console.log('Fetched: ' + itemNames.length);
    return itemNames;
}

async function getItemPriceHistory(name) {
    const opts = {
        headers: {
            cookie: 'steamLoginSecure=' + process.env.STEAM_LOGIN_SECURE,
        }
    };
    name = name.replace("/", "-").replace("&", "[PERCENTAGE]26");
    var URI = 'https://steamcommunity.com/market/pricehistory/?appid=' + appid + '&market_hash_name=' + name;
    var encodedURL = encodeURI(URI).replace("[PERCENTAGE]", "%");
    console.log('Now fetching: ' + encodedURL);
    var response = await axios.get(encodedURL, opts);
    var prices = response.data.prices;
    return prices;
}

async function run() {
    const names = await getItemNames();
    const results = {};
    console.log('Total number of items: ' + names.length);
    for (var name of names) {
        if (name != undefined) {
            results[name.replace('.', '[dot]')] = await getItemPriceHistory(name); // mongodb doesn't allow . in key names
            await sleep(10000);
        }
    }
    console.log(results);
    console.log(Object.keys(results).length);
    
    fs.writeFileSync(gameDict[appid] + '.json', JSON.stringify(results));

    var gfs = gridfs(connection.db);
    var writestream = gfs.createWriteStream({
        _id: gameDict[appid], 
        filename: gameDict[appid] + '.json',
        mode: 'w',
        content_type: 'application/json',
        root: 'steamData'
    });
    fs.createReadStream(gameDict[appid] + '.json').pipe(writestream);
    writestream.on('close', function (file) {
       console.log('File Created : ' + file.filename);
    });
    // var Data = mongoose.model('Data', schema);
    // var data = new Data({gameName: gameDict[appid], data: results});
    // Data.findOneAndUpdate({gameName: gameDict[appid]}, data, {upsert: true}, function(err, doc) {
    //     if (err) console.log(err);
    //     else console.log('DB successfully updated. Object has this many keys: ' + Object.keys(doc.data).length);
    // }); 
}

run(); // Run Barry, run!