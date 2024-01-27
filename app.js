/* modules */
const Discord = require('discord.js');
const { MessageAttachment } = require('discord.js');
const cookieParser = require('cookie-parser');
const fileUpload = require("express-fileupload");
const moment = require('moment');
const tz = require('moment-timezone');
const ejs = require('ejs');
const express = require('express');
const axios = require('axios');

/* global variables */
const Global = require('./Global.js').config;
const app = express();
const client = new Discord.Client();

const knex = require("knex")({
  client: "postgres",
  connection: process.env["DATABASE_URL"],

  pool: { min: 0, max: 80 },
});

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
app.use('/css', express.static(__dirname + 'public/css'));
// app.use('/imgs', express.static(__dirname + 'public/imgs'));

/* set views */
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/* routes */
app.get('/', (req, res) => {
    res.render('index', {
      humanFileSize: Global.maxFileSize.human,
      byteFileSize: Global.maxFileSize.byte
    });
});

app.get('/results', (req, res) => {
    const uploadResults = req.cookies.results;
  
    res.render('results', {
        url: uploadResults.cdn,
        proxyURL: uploadResults.proxy,
        customURL: uploadResults.custom,
        messageId: uploadResults.id,
        uploadDate: uploadResults.uploaded,
        fileType: uploadResults.mime
    });
});

app.get('/attachments/:messageId/:attachmentId/:filename', async (req, res) => {
    const channelId = Global.fileChannel;
    const attachmentId = req.params.attachmentId;
    const filename = req.params.filename;

    try {
        const query = await knex('message_ids')
            .where('ahid', BigInt(attachmentId))
            .first();

        if (!query.mid) {
            return res.status(404).send('Message ID not found for the given channel.');
        }

        client.channels.cache.get(channelId).messages.fetch(query.mid.toString())
            .then(message => {
                const cdnUrl = message.attachments.first()?.url;
                if (!cdnUrl) {
                    return res.status(404).send('CDN URL not found for the given message.');
                }
                axios.get(cdnUrl, { responseType: 'stream' })
                    .then(response => {
                        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                        res.setHeader('Content-Type', response.headers['content-type']);
                        response.data.pipe(res);
                    })
                    .catch(error => {
                        console.error('Error streaming file from CDN:', error);
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch(error => {
                console.error('Error fetching message:', error);
                res.status(500).send('Internal Server Error');
            });
    } catch (error) {
        console.error('Error fetching message ID:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/upload', async (req, res) => {
    // if (!req.files || !req.files.file || !req.body.mid) return res.status(400).send('No value was provided.');
    if (req.body.mid) {
        // Fetch the message by ID and then set cookies
        client.channels.cache.get(Global.fileChannel).messages.fetch(req.body.mid)
            .then(message => {
                setCookies(req, res, message).then(() => {
                    res.redirect('/results');
                }).catch(err => console.log(err));
            })
            .catch(err => res.status(404).send('Message not found.'));
        return;
    }
    if (req.files.file.size > Global.maxFileSize) return res.status(413).send('File too large.');
    const buffer = Buffer.from(req.files.file.data);
    const attachment = new MessageAttachment(buffer, req.files.file.name);
    client.channels.cache.get(Global.fileChannel).send(attachment);
    client.on('message', message => {
        if (message.author.id !== client.user.id) return;
        if (message.channel.id !== Global.fileChannel) return;
        if (!message.attachments.first()) return;
        if (req.headers['upload-source'] === 'API') return res.send(message.attachments.first()?.url);
        setCookies(req, res, message).then(async () => {
            await knex("message_ids").insert({
              ahid: BigInt(message.attachments.first().id),
              mid: BigInt(message.id),
            });

            res.redirect('/results');
        }).catch(err => console.log(err));
    });
}); 

app.listen(Global.port, () => {
    console.clear();
    console.log(`Server is running @ http://${Global.host}:${Global.port}`);
    client.login(Global.token);
});

function setCookies(req, res, message) {
    return new Promise((resolve, reject) => {
        res.cookie('results', {
          cdn: message.attachments.first()?.url,
          proxy: message.attachments.first()?.proxyURL,
          custom: message.attachments.first()?.url.split("?")[0].replace("cdn.discordapp.com", "cdn-slave.spin.rip"),
          id: message.id,
          uploaded: moment.tz('America/Los_Angeles').format("[File uploaded on ] LL [PST]"),
          mime: req.files?.file?.mimetype || ""
        });
        resolve();
    });
}