const searchInput = document.getElementById("input-search");
const generateInput = document.getElementById("input-generate");
const playlist = document.getElementById("playlist");
const searchAutoPlay = document.getElementById("search-autoplay")

var queue = [];
var addedVideos = new Set();
var currentVideo = -1;
var enqueuedVideos = [];
var mouseOver = null;

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
  if(event.data == 0)
  {
    //when video finishes
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
  var index = queue.indexOf(video);
  currentVideo = index;

  //delete video
  deleteVideo(video);

  //play the video
  player.loadVideoById(video.videoId);
  player.playVideo();

  //generates new videos
  generateVideos(video);
}

function deleteVideo(video)
{
  const index = queue.indexOf(video);

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

function generateVideos(video)
{
  //generate videos from video

  //gets gennumber from input and checks to see if valid number
  //if not valid then default to 5
  var generateNumber = generateInput.value ? parseInt(generateInput.value) : 5;

  //no point if generateNumber is 0 or lower, dont waste my resources
  if(generateNumber <= 0) return; 

  fetch(`/get_recommended_videos/${video.videoId}`)
  .then(res => res.json())
  .then(json => {
    //gets the min between gennumber and returned array(otherwise out of bounds)
    const min = generateNumber < json.length ? generateNumber : json.length;

    for(var i = 0; i < min; i++)
    {
      const video = json[i];

      if(!addedVideos.has(video.videoId))
      {
        //if video hasnt been added before then add videoID to added videos
        addedVideos.add(video.videoId); 

        //add to playlist and queue
        addVideoToPlaylist(video);
        queue.push(video); 
      }
    }

    //update the indicators afterwards
    updateIndicators();
  })
}

function enqueueVideo(video)
{
  //add video to enqueuedVideos, if it already exists, then remove it

  if(enqueuedVideos.includes(video)) {
    //remove the video from enqueuedVideos
    enqueuedVideos.splice(enqueuedVideos.indexOf(video), 1);
  } else {
    //push the video into enqueuedVideos
    enqueuedVideos.push(video);
  }

  //update the indicators afterwards
  updateIndicators();
}

function addVideoToPlaylist(video)
{
  const videoTitle = video.videoTitle;
  const videoThumb = video.videoThumb;
  const videoUrl = video.videoUrl;

  const playlistEl = document.getElementById("playlist");

  const videoEl = document.createElement("div");
  videoEl.className = "playlist-item";

  const thumbEl = document.createElement("img");
  thumbEl.className = "video-thumb";
  thumbEl.setAttribute("src", videoThumb);
  thumbEl.onclick = () => playVideo(video);

  const titleEl = document.createElement("h1");
  titleEl.className = "video-title";
  titleEl.onclick = () => playVideo(video); 

  const linkEl = document.createElement("a");
  linkEl.href = videoUrl;
  linkEl.textContent = videoTitle;
  linkEl.style.textDecoration = "none";
  linkEl.style.color = "inherit";
  linkEl.addEventListener("click", event => {
    //preventDefault as to not redirect to link on click
    event.preventDefault();
  })

  playlistEl.appendChild(videoEl);
  videoEl.appendChild(thumbEl);
  videoEl.appendChild(titleEl);
  titleEl.appendChild(linkEl);

  //mouseover event
  videoEl.addEventListener("mouseenter", () => {
    mouseOver = video;
  })
  videoEl.addEventListener("mouseleave", () => {
    mouseOver = null;
  })
}

function searchVideo(url)
{
  //clear input
  searchInput.value = "";

  const videoRegex = /(?<=^(https?\:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtube\.com\/|youtu\.be\/))[A-z0-9_-]{11}/;
  const match = url.match(videoRegex);

  if(match)
  {
    //checks whether url even matches regex
    var video = {
      videoId: "",
      videoTitle: "",
      videoUrl: "",
      videoThumb: ""
    };

    //match[0] is id of video, because im smart
    video.videoId = match[0];

    //if searchAutoPlay is checked, then autoplay the video
    if(searchAutoPlay.checked) {
      //add videoID to added videos (order is important)
      addedVideos.add(video.videoId);

      //play video
      player.loadVideoById(video.videoId);
      player.playVideo();
    }

    //generate videos using just created video object
    generateVideos(video);
  }
}

//document key mouse over event
document.addEventListener("keydown", event => {
  if(!mouseOver || document.activeElement == generateInput
                || document.activeElement == searchInput) return;
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
