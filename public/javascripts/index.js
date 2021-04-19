const searchInput = document.getElementById("input-search");
const generateInput = document.getElementById("input-generate");
const playlist = document.getElementById("playlist");
const searchAutoPlay = document.getElementById("search-autoplay")

var queue = [];
var addedVideos = new Set();
var currentVideo = -1;
var enqueuedVideo = -1;

searchInput.onkeyup = (e) => {
  if(e.keyCode == 13 && searchInput.value) // "Enter" key
  {
    searchVideo(searchInput.value);
  }
}

generateInput.onkeyup = (e) => {
  if(e.keyCode == 13 && searchInput.value) // "Enter" key
  {
    searchVideo(searchInput.value);
  }
}

function onPlayerStateChange(event) { //when video finishes
  if(event.data == 0)
  {
    //plays enqueuedVideo if there is one
    if(enqueuedVideo != -1) {
      playVideo(queue[enqueuedVideo]);
      enqueuedVideo = -1;
      return;
    }

    if(currentVideo < queue.length && currentVideo >= 0) //check if currentVideo is in bounds
    {
      playVideo(queue[currentVideo]);
    }
    else if(queue.length > 0) //checks if queue even has something
    {
      currentVideo = 0;
      playVideo(queue[currentVideo]);
    }
    else
    {
      currentVideo = -1;
    }
  }
}

function updateBorder()
{
  for(var i = 0; i < playlist.children.length; i++)
    playlist.children[i].style.border = "";

  //colors the enqueuedVideo if there is one
  if(playlist.children[enqueuedVideo])
    playlist.children[enqueuedVideo].style.border = "2px solid green";

  //indicate currentVideo
  if(currentVideo == -1 || currentVideo >= playlist.children.length)
    playlist.children[0].style.border = "2px solid red";
  else if(currentVideo >= 0 && currentVideo < playlist.children.length)
    playlist.children[currentVideo].style.border = "2px solid red";
}

function playVideo(video)
{
  var index = queue.indexOf(video);
  currentVideo = index; //gets index and sets currentVideo

  removeVideoFromPlaylist(index);
  queue.splice(index, 1); //remove from playlist

  player.loadVideoById(video.videoId);
  player.playVideo(); //play the video

  generateVideos(video); //generates new videos

  //update the border afterwards
  updateBorder();
}

function removeVideoFromPlaylist(index)
{
  if(index >= 0 && index < playlist.children.length)
    playlist.children[index].remove();
}

function generateVideos(video) //generate videos from video
{
  var generateNumber = generateInput.value ? parseInt(generateInput.value) : 5; //gets gennumber from input
                                                                                //and checks to see if valid number
                                                                                //if not valid then default to 5
  if(generateNumber <= 0) return; //no point if generateNumber is 0 or lower, dont waste my resources

  fetch(`/get_recommended_videos/${video.videoId}`)
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    var min = generateNumber < json.length ? generateNumber : json.length; //gets the min between gennumber and 
                                                                           //returned array(otherwise out of bounds)
    for(var i = 0; i < min; i++)
    {
      var video = json[i];
      if(!addedVideos.has(video.videoId)) //if video hasnt been added before
      {
        addedVideos.add(video.videoId); //add videoID to added videos
        addVideoToPlaylist(video);
        queue.push(video); //add to playlist
      }
    }

    //update the border afterwards
    updateBorder();
  })
}

function enqueueVideo(video)
{
  //sets the enqueuedVideo to the video's index and updates border
  const index = queue.indexOf(video);

  //stop if the index is equal to currentVideo, because that dont make sense
  if(index == currentVideo) return;

  enqueuedVideo = index;

  //update the border afterwards
  updateBorder();
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

  //if the mouse is over the videoEl and user presses E
  //then it will enqueue the video that was moused over to play next
  var isMouseOver = false;
  
  document.addEventListener("keydown", event => {
    if(!isMouseOver) return;
    if(event.code == "KeyE") enqueueVideo(video);
  })
  videoEl.addEventListener("mouseenter", () => {
    isMouseOver = true;
  })
  videoEl.addEventListener("mouseleave", () => {
    isMouseOver = false;
  })
}

function searchVideo(url)
{
  searchInput.value = ""; //clear input
  const videoRegex = /(?<=^(https?\:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtube\.com\/|youtu\.be\/))[A-z0-9_-]{11}/;
  var match;
  if(match = url.match(videoRegex)) //checks whether url even matches regex
  {
    var video = {
      videoId: "",
      videoTitle: "",
      videoUrl: "",
      videoThumb: ""
    };
    video.videoId = match[0]; //match[0] is id of video, because im smart

    //if searchAutoPlay is checked, then autoplay the video
    if(searchAutoPlay.checked) {
      addedVideos.add(video.videoId);//add videoID to added videos (order is important)

      player.loadVideoById(video.videoId); //play video
      player.playVideo();
    }

    generateVideos(video);    //generate videos using just created video object
  }
}
