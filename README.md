# Vapourizer 💨
A node app to get the price histories of ALL items of a given steam game.

## Setting up the environment
```
npm install
```
 - Create a .env file.
 - Assign the following environment variables:
 
 | Variable name      | Description                                                        |
 | ------------------ | ------------------------------------------------------------------ |
 | STEAM_LOGIN_SECURE | steamLoginSecure cookie from your browser after signing into steam |
 | MONGO_URL          | Your MongoDB connection string                                     |

## Running the app
```node app.js <appid of the game> <only phase 2?>``` 

**Note:** Refer to the samples folder for a good idea of what kind of data is retrieved.

## How it works
There are 2 phases - the item name collection phase (phase 1) and the price history collection phase (phase 2). 

In phase 1, the names of all the items in the market are collected and stored in a json file which is named as *<Your-Game-Name>Names.json*. 

Then, in phase 2, each and every single item name we have fetched is used to get the price history of that item. This is again stored in a json file named *<Your-Game-Name>.json* and uploaded to MongoDB using GridFS.

## FAQs
### Why?
Data. We needed data for [this](https://github.com/Nightmare99/SteamQuest). Scraping data using the web app itself was a pain. So I wrote this handy tool.

### I need data for game X, and your app doesn't support it.
Just add in the appid to the ```gameDict``` object in *app.js* with the game's name. Simple as that.

### IT TAKES SO LONG 🤬
Bruh steam doesn't like us spamming their servers, so every now and then during phase 1, we get hit with a 429: too many requests. That's why there's a 1 minute pause once steam slaps us with that 429. Reducing it will do you no good cause steam sets the cooldown and you will have to wait for it.

### Ran out of memory 🤬🤬
Run app.js with ```--max-old-space-size <MORE RAM>```.

### The app crashed after phase 1. Do I have to run the entire thing again?
No, after phase 1, a new json file with the name *<Your-Game-Name>Names.json* is created (refer samples). Simply run ```node app.js <appid of the game> true``` 