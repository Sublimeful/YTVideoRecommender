const express = require("express");
const ytdl = require("ytdl-core");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

function delay(time) {
  //delay function (will be useful later on)
  return new Promise(function(resolve) { 
    setTimeout(resolve, time);
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/generator/:videoId', async (req, res) => {
  const videoId = req.params["videoId"];
  const info = await ytdl.getBasicInfo(videoId);

  res.send(info.related_videos);
})

app.listen(port, () => {
  console.log(`🔥 server is listening on port ${port}!`);
})



