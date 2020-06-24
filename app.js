import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import mongoose from 'mongoose';
import gridfs from 'gridfs-stream';
import { exit } from 'process';

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

var appid = process.argv[2]; // App ID of the target game. CSG0 - 730, DotA 2 - 570, PUBG - 578080. You will only have to change here.
var gameDict = {
    '730': 'CSGO',
    '570': 'DotA2',
    '578080': 'PUBG'
}; // Add any other games here. Format - appid: name
if (Object.keys(gameDict).indexOf(String(appid)) == -1) {
    console.log('This game is not supported. Refer the README to find out how to add support.');
    exit(127);
}

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
            results[name] = await getItemPriceHistory(name);
            await sleep(10000);
        }
    }
    console.log(results);
    console.log(Object.keys(results).length);
    
    fs.writeFileSync(gameDict[appid] + '.json', JSON.stringify(results));

    var gfs = gridfs(connection.db);
    var options = {
        _id: gameDict[appid],
        root: 'steamData'
    };
    gfs.exist(options, function (err, found) {
        if (err) console.log(err);
        if (found) {
            console.log('Data already exists in GridFS, deleting...');
            gfs.remove(options, function (err) {
                if (err) console.log(err);
                console.log('Deleted existing record.');
            });
        }
        else console.log('Data not found in GridFS, creating new record...');
    });

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
}

run(); // Run Barry, run!