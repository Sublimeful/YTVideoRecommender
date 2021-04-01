const searchInput = document.getElementById("input-search");
const generateInput = document.getElementById("input-generate");
const playlist = document.getElementById("playlist")

var queue = [];
var played = new Set();
var currentVideo = -1;
var canSearchVideo = true;

searchInput.onkeyup = (e) => {
  if(e.keyCode == 13 && canSearchVideo) // Enter key
  {
    searchVideo(searchInput.value);
  }
}

function onPlayerStateChange(event) { //when video finishes
  if(event.state == 0)
  {
    if(currentVideo < queue.length)
    {
      playVideo(queue[currentVideo]);
    }
    else
    {
      currentVideo = 0;
      playVideo(queue[currentVideo]);
    }
  }
}

function playVideo(video)
{
  var index = queue.indexOf(video);
  currentVideo = index;

  removeVideoFromPlaylist(index);
  queue.splice(index, 1);

  player.loadVideoById(video.videoId);
  player.playVideo();

  played.add(video);

  generateVideos(video);
}

function removeVideoFromPlaylist(index)
{
  playlist.children[index].remove();
}

function generateVideos(video) //generate videos from video
{
  fetch(`/get_videos/${video.videoId}`)
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    var generateNumber = generateInput.value ? parseInt(generateInput.value) : 5;
    var min = generateNumber < json.length ? generateNumber : json.length;

    for(var i = 0; i < min; i++)
    {
      if(!played.has(json[i])) //if video hasnt been played before
      {
        addVideoToPlaylist(json[i]);
        queue.push(json[i]);
      }
    }
  })
}

function addVideoToPlaylist(video)
{
  var videoTitle = video.videoTitle;
  var videoThumb = video.videoThumb;

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

  playlistEl.appendChild(videoEl);
  videoEl.appendChild(thumbEl);
  videoEl.appendChild(titleEl);
}

function searchVideo(url)
{
  searchInput.value = ""; //clear input
  const videoRegex = /(?<=^(https?\:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtube\.com\/|youtu\.be\/))[A-z0-9_-]{11}/;
  var match;
  if(match = url.match(videoRegex))
  {
    var video = {
      videoId: "",
      videoTitle: "",
      videoUrl: "",
      videoThumb: ""
    };
    video.videoId = match[0];
    generateVideos(video);

    searchInput.style.display = "none";
    canSearchVideo = false;
  }
}
