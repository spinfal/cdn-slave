/* modules */
const Discord = require('discord.js');
const { MessageAttachment } = require('discord.js');
const cookieParser = require('cookie-parser');
const fileUpload = require("express-fileupload");
const ejs = require('ejs');
const express = require('express');

/* global variables */
const Global = require('./Global.js').config;
const app = express();
const client = new Discord.Client();

/* discord client */
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

/* middleware */
app.use(cookieParser());
app.use(fileUpload());

/* static files */
app.use(express.static('public'));
// app.use('/js', express.static(__dirname + 'public/js'));
// app.use('/css', express.static(__dirname + 'public/css'));
// app.use('/imgs', express.static(__dirname + 'public/imgs'));

/* set views */
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/* routes */
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/results', (req, res) => {
    const cookies = req.cookies;
    res.render('results', {
        url: cookies.url,
        proxyURL: cookies.proxyURL
    });
});

app.post('/api/upload', async (req, res) => {
    if (!req.files) return res.status(400).send('No files were provided.');
    if (req.files.file.size >= 8000000) return res.status(413).send('File too large. Discord is so generous, so generous in fact that they give everyone a whole 8MB limit! If you have a file bigger than that, then try something else as this will not work.');
    const buffer = Buffer.from(req.files.file.data);
    const attachment = new MessageAttachment(buffer, req.files.file.name);
    client.channels.cache.get(Global.fileChannel).send(attachment);
    client.on('message', message => {
        if (message.channel.id !== Global.fileChannel) return;
        if (!message.attachments.first()) return;
        setCookies(res, message).then(() => {
            res.redirect('/results');
        }).catch(err => console.log(err));
    })
}); 

app.listen(Global.port, () => {
    console.clear();
    console.log(`Server is running @ http://${Global.host}:${Global.port}`);
    client.login(Global.token);
});

function setCookies(res, message) {
    return new Promise((resolve, reject) => {
        res.cookie('url', message.attachments.first()?.url, { maxAge: 900000 });
        res.cookie('proxyURL', message.attachments.first()?.proxyURL, { maxAge: 900000 });
        resolve();
    });
}