const express = require("express");
const puppeteer = require("puppeteer"); //using puppeteer, use puppeteer-core if you want
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(__dirname + '/public'));

/*
  delay function (will be useful later on)
*/
function delay(time) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

/*
  function to generate recommended videos based from a video
*/
async function getRecommendedVideosFromVideo(videoId)
{
  var videoUrl = 'https://www.youtube.com/watch?v=' + videoId;

  var browser = await puppeteer.launch({ headless: true });
  var page = await browser.newPage();

  page.goto(videoUrl);
  await page.waitForSelector("a#thumbnail"); //goto video url and wait for a#thumbnail, which i found was usually
  await delay(1000);                         //the last element to load, wait a second for other elements to load in

  var urls = await page.evaluate(() => {
    var thumbnails = document.querySelectorAll("a#thumbnail"); //select all thumbnails
    var links = [];
    for(var i = 0; i < thumbnails.length; i++) //loop through, check if they're valid videos, not dumb stuff like radios
    {                                          //or livestreams, although you could implement that if you want to
      var videoUrl = thumbnails[i].href;
      var regex = new RegExp(/^https:\/\/www\.youtube\.com\/watch\?v=[A-z0-9_-]{11}$/);
      if(!regex.test(videoUrl)) continue;

      var video = {
        videoId: "",
        videoTitle: "",
        videoUrl: "",
        videoThumb: ""
      };

      video.videoId = videoUrl.substring(videoUrl.length - 11);             //videoid is guarenteed to be last 11 chars
      video.videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
      try                                                                   //sometimes this one line of code fails for some
      {                                                                     //reason, so use try block to prevent that
        video.videoTitle = thumbnails[i].parentElement.parentElement.querySelector("#video-title").textContent.trim();
      }
      catch
      {
        continue;
      }
      video.videoThumb = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`; //thumbnails are in this format

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

app.get('/get_recommended_videos/:videoId', async (req, res) => {
  var videoId = req.params["videoId"];
  var links = await getRecommendedVideosFromVideo(videoId);
  res.send(links);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})





















