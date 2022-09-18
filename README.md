# CDN Slave
A simple website that allows you to upload files to Discord's CDN without having to do it in their app.

## Prerequisites
[Node.js](https://nodejs.org/)

[Discord Bot](https://discord.com/developers/applications)

[Git](https://git-scm.com/downloads) (optional)

## Installation
### Run this command:
```
git clone https://github.com/spinfal/cdn-slave.git
```
or download the ZIP file and extract it
```
cd cdn-slave
```
### Follow these steps:
- Rename [Global.example.js](Global.example.js) to `Global.js`
- Go to https://discord.com/developers/applications and create bot
- Make sure this is enabled
![Message Content Intent](https://cdn.spin.rip/r/8ee0777a-7e2c-41ab-a64d-b6ba8b9c8df6.png "Message Content Intent")
- Invite the bot to your server using this link: `https://discord.com/api/oauth2/authorize?client_id=INSERT YOUR APPLICATION ID&permissions=52224&scope=bot`
- Configure the `Global.js` file 

### Continue with running these commands:
```
npm i
```
```
npm run start
```
or 
```
npm run dev
```

## Usage
The website will be up @ http://localhost:443 (unless you've changed the config)

Files uploaded on the site will be available in the channel that you set in `Global.js`

## Usage with ShareX
CDN Slave can also be used with [ShareX](https://getsharex.com/)! Follow these steps to get it working (don't want to follow steps? [click here to download the config](https://cdn.spin.rip/r/CDN-Slave_(Discord_CDN).sxcu)):

1. Copy the upload endpoint. If using localhost it will be `http://localhost:443/api/upload`, or if you're using my instance it will be `https://cdn-slave.spin.rip/api/upload`
2. Open ShareX and go to `Destinations` > `Custom uploader settings` > Click `New`
3. Name it whatever you want & paste the upload endpoint in `Request URL`
4. Under `Destination type`, select `Image uploader`, `Text uploader`, and `File uploader`
5. Body should be `Form data (multipart/form-data)` and `File form name` should just be `file`.
6. In the headers section, set the name to `Upload-Source` and the value to `API`
7. Select your new ShareX config in the dropdowns at the bottom left of your screen
8. Have fun with your new CDN slave.
![ShareX CDN Slave GIF tutorial](https://cdn.spin.rip/r/ShareX_5685615049.gif)
