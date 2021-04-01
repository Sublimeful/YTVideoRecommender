const express = require("express");
const puppeteer = require("puppeteer-core");
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(__dirname + '/public'));

function delay(time) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

async function get_videos(videoId)
{
  var videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
  var url = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

  var browser = await puppeteer.launch({ headless: true, executablePath: url });
  var page = await browser.newPage();

  page.goto(videoUrl);
  console.log("1");
  await page.waitForSelector("a#thumbnail");
  console.log("2");
  await delay(1000);
  console.log("3");

  console.log("go!");

  var urls = await page.evaluate(() => {
    var thumbnails = document.querySelectorAll("a#thumbnail");
    var links = [];
    for(var i = 0; i < thumbnails.length; i++)
    {
      var videoUrl = thumbnails[i].href;
      var regex = new RegExp(/^https:\/\/www\.youtube\.com\/watch\?v=[A-z0-9_-]{11}$/);
      if(!regex.test(videoUrl)) continue;

      var video = {
        videoId: "",
        videoTitle: "",
        videoUrl: "",
        videoThumb: ""
      };

      video.videoId = videoUrl.substring(videoUrl.length - 11);
      video.videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
      try
      {
        video.videoTitle = thumbnails[i].parentElement.parentElement.querySelector("#video-title").textContent.trim();
      }
      catch
      {
        continue;
      }
      video.videoThumb = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;

      links.push(video);
    }
    return links;
  })

  await browser.close();
  return urls;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

app.get('/get_videos/:videoId', async (req, res) => {
  var videoId = req.params["videoId"];
  var links = await get_videos(videoId);
  res.send(links);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})





















