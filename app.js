const express = require("express");
const puppeteer = require("puppeteer");
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

async function getRecommendedVideosFromVideo(videoId)
{
  //function to generate recommended videos based from a video

  var videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
  var browser = await puppeteer.launch({ headless: true });
  var page = await browser.newPage();

  //goto video url and wait for a#thumbnail, which i found was usually
  //the last element to load, wait a second for other elements to load in
  page.goto(videoUrl);

  await page.waitForSelector("a#thumbnail");
  await delay(1000);                         

  var urls = await page.evaluate(() => {
    //select all thumbnails and evaluate them
    var thumbnails = document.querySelectorAll("a#thumbnail");
    var links = [];

    //loop through, check if they're valid videos, not dumb stuff like radios
    //or livestreams, although you could implement that if you want to
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
      video.videoThumb = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;

      //sometimes this one line of code fails for some reason, so use try block to prevent that
      try {
        //ew
        video.videoTitle = thumbnails[i].parentElement.parentElement.querySelector("#video-title").textContent.trim();
      }
      catch { continue; }

      links.push(video);
    }
    return links;
  })

  await browser.close();
  return urls;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/get_recommended_videos/:videoId', async (req, res) => {
  var videoId = req.params["videoId"];
  var links = await getRecommendedVideosFromVideo(videoId);
  res.send(links);
})

app.listen(port, () => {
  console.log(`🔥 server is listening on port ${port}!`);
})



