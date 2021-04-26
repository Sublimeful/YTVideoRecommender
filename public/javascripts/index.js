const searchInput = document.getElementById("input-search");
const generateInput = document.getElementById("input-generate");
const playlist = document.getElementById("playlist");
const searchAutoPlay = document.getElementById("search-autoplay")
const filterSecondsInput = document.getElementById("filter-seconds")

var queue = [];
var addedVideos = new Set();
var currentVideo = -1;
var enqueuedVideos = [];
var mouseOver = null;

filterSecondsInput.onkeyup = event => {
  if(event.code == "Enter" && searchInput.value)
  {
    searchVideo(searchInput.value);
  }
}

searchInput.onkeyup = event => {
  if(event.code == "Enter" && searchInput.value)
  {
    searchVideo(searchInput.value);
  }
}

generateInput.onkeyup = event => {
  if(event.code == "Enter" && searchInput.value)
  {
    searchVideo(searchInput.value);
  }
}

function onPlayerStateChange(event) {
  //when the youtube video finishes
  if(event.data == 0)
  {
    //plays first enqueuedVideo if there is one
    if(enqueuedVideos.length > 0) {
      playVideo(enqueuedVideos[0]);
      return;
    }

    if(currentVideo < queue.length && currentVideo >= 0)
    {
      //check if currentVideo is in bounds
      //if it is then play currentVideo
      playVideo(queue[currentVideo]);
    }
    else if(queue.length > 0)
    {
      //checks if queue even has something
      //if it does then play the first video
      playVideo(queue[0]);
    }
    else
    {
      //otherwise dont play anything
      //set currentVideo to -1
      currentVideo = -1;
    }
  }
}

function updateIndicators()
{
  //return if there is nothing in the playlist
  if(playlist.children.length == 0) return;

  //remove all the borders from the playlist
  for(var i = 0; i < playlist.children.length; i++) {
    playlist.children[i].style.border = "";
    playlist.children[i].style.backgroundColor = "";
  }

  //indicate currentVideo
  if(currentVideo == -1 || currentVideo >= playlist.children.length) {
    playlist.children[0].style.border = "2px solid white";
    playlist.children[0].style.backgroundColor = "white";
  }
  else if(currentVideo >= 0 && currentVideo < playlist.children.length) {
    playlist.children[currentVideo].style.border = "2px solid white";
    playlist.children[currentVideo].style.backgroundColor = "white";
  }

  //colors the enqueuedVideos
  for(var i = 0; i < enqueuedVideos.length; i++)
  {
    const hue = 30 * i % 360;
    const video = enqueuedVideos[i];
    const index = queue.indexOf(video);
    if(playlist.children[index]) {
      playlist.children[index].style.border = `2px solid hsl(${hue}, 100%, 50%)`;
      playlist.children[index].style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    }
  }
}

function playVideo(video)
{
  //gets index and sets currentVideo
  currentVideo = queue.indexOf(video);

  //delete video
  deleteVideo(video);

  //play the video
  player.loadVideoById(video.id);
  player.playVideo();

  //generates new videos
  generateVideos(video.id);
}

function deleteVideo(video)
{
  const index = queue.indexOf(video);

  //if the index does not exist then return;
  if(index == -1) return;

  //delete from enqueuedVideos
  if(enqueuedVideos.includes(video))
    enqueuedVideos.splice(enqueuedVideos.indexOf(video), 1);

  //delete from playlist
  if(index >= 0 && index < playlist.children.length)
    playlist.children[index].remove();

  //delete from queue
  queue.splice(index, 1);

  //update the indicators afterwards
  updateIndicators();
}

function generateVideos(videoId)
{
  //gets gennumber from input, defaults to a high number
  var generateNumber = parseInt(generateInput.value);
  if(isNaN(generateNumber)) generateNumber = 999;

  //no point if generateNumber is 0 or lower
  if(generateNumber <= 0) return; 

  var filterSeconds = parseInt(filterSecondsInput.value);

  //no point if filterSeconds is 0 or lower
  if(filterSeconds <= 0) return; 


  fetch(`/get_recommended_videos/${videoId}`)
  .then(res => res.json())
  .then(videos => {
    //filter videos based on seconds, skip if filterSeconds is NaN
    if(!isNaN(filterSeconds)) {
      videos = videos.filter(video => {
        return (video.length_seconds <= filterSeconds);
      });
    }

    //gets the min between gennumber and returned array(otherwise out of bounds)
    const min = generateNumber < videos.length ? generateNumber : videos.length;

    for(var i = 0; i < min; i++) {
      const video = videos[i];
      if(!addedVideos.has(video.id))
      {
        addedVideos.add(video.id); 
        addVideoToPlaylist(video);
        queue.push(video); 
      }
    }

    updateIndicators();
  })
}

function enqueueVideo(video)
{
  if(enqueuedVideos.includes(video))
    enqueuedVideos.splice(enqueuedVideos.indexOf(video), 1);
  else
    enqueuedVideos.push(video);

  updateIndicators();
}

function addVideoToPlaylist(video)
{
  const videoTitle = video.title;
  const videoThumb = video.thumbnails[video.thumbnails.length - 1].url;
  const videoUrl = `https://youtu.be/${video.id}`;

  const playlistEl = document.getElementById("playlist");

  const videoEl = document.createElement("div");
  videoEl.className = "playlist-item";

  const thumbEl = document.createElement("img");
  thumbEl.className = "video-thumb";
  thumbEl.setAttribute("src", videoThumb);
  thumbEl.onclick = () => playVideo(video);

  const titleEl = document.createElement("h1");
  titleEl.className = "video-title";
  titleEl.textContent = videoTitle;
  titleEl.onclick = () => playVideo(video); 

  const linkEl = document.createElement("a");
  linkEl.href = videoUrl;
  linkEl.addEventListener("click", event => {
    //preventDefault as to not redirect to link on click
    event.preventDefault();
  })

  playlistEl.appendChild(videoEl);
  linkEl.appendChild(thumbEl);
  videoEl.appendChild(linkEl);
  videoEl.appendChild(titleEl);

  videoEl.addEventListener("mouseenter", () => {
    mouseOver = video;
  })
  videoEl.addEventListener("mouseleave", () => {
    mouseOver = null;
  })
}

function searchVideo(url)
{
  //check if url is youtube link, return otherwise
  const videoRegex = /(?<=^(https?\:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtube\.com\/|youtu\.be\/))[A-z0-9_-]{11}/;
  const match = url.match(videoRegex); if(!match) return;
  const videoId = match[0];

  if(searchAutoPlay.checked) {
    //add videoID to addedVideos, then play video (order is important)
    addedVideos.add(videoId);
    player.loadVideoById(videoId);
    player.playVideo();
  }

  generateVideos(videoId);
}

document.addEventListener("keydown", event => {
  if(!mouseOver || document.activeElement == generateInput
                || document.activeElement == searchInput
                || document.activeElement == filterSecondsInput) return;
  switch(event.code) {
    case "KeyE":
      //enqueue video
      enqueueVideo(mouseOver);
      break;
    case "KeyD":
      //delete video
      deleteVideo(mouseOver);
      break;
  }
})
