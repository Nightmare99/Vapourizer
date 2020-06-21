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
```node app.js <appid of the game>``` 

**Note:** Refer to the samples folder for a good idea of what kind of data is retrieved. The '.' character in all names fetched is replaced with [dot] because MongoDB doesn't like dots in object keys.

## FAQs
### Why?
Data. We needed data for [this](https://github.com/Nightmare99/SteamQuest). Scraping data using the web app itself was a pain. So I wrote this handy tool.

### I need data for game X, and your app doesn't support it.
Just add in the appid to the ```gameDict``` object in *app.js* with the game's name. Simple as that.

### IT TAKES SO LONG 🤬
Bruh steam doesn't like us spamming their servers, so to avoid getting a 429: too many requests, there's a 10 second delay between every request. You can maybe try reducing it, but hey, consider yourself warned.

### There is only one actual question in the FAQs
It's my repo. Deal with it.
