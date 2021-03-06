//Need to get the inner text of the textarea
let searchContent = null
document.querySelector("button").addEventListener("click", function() {
  searchContent = document.getElementById("searchContent").value
})

//Get the auth token and send a request
document.querySelector("button").addEventListener("click", async function() {
  if (searchContent) {
    searchContent = searchContent.toLowerCase()
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      tab = tabs[0].url
      let youtubeVideoId = tab.split("v=")[1]
      let ampersandPosition = youtubeVideoId.indexOf("&")
      let youtubeVideo = ""
      if (ampersandPosition != -1) {
        youtubeVideoId = youtubeVideoId.substring(0, ampersandPosition)
      }

      ampersandPosition = tab.indexOf("&")
      if (ampersandPosition != -1) {
        youtubeVideo = tab.substring(0, ampersandPosition)
      } else {
        youtubeVideo = tab
      }

      //Need to get the youtube id from the current tab
      let initial = {
        method: "GET",
        async: true,
        headers: {
          "Content-Type": "application/json"
        },
        contentType: "json"
      }

      let corsProxy = "https://cors-anywhere.herokuapp.com/"
      let youtubePlaceholder = "https://www.youtube.com/watch?v="
      let youtubeUrl = youtubePlaceholder + youtubeVideoId
      fetch(corsProxy + youtubeUrl, initial)
        .then(response => response.text())
        .then(responseText => {
          let sanitizedResponse = responseText
            .replace("\\u0026", "&")
            .replace("\\", "")
            .split('"captions":')

          let captionsTracks = JSON.parse(
            sanitizedResponse[1].split(',"videoDetails')[0].replace("\n", "")
          )["playerCaptionsTracklistRenderer"]["captionTracks"]

          let englishUrl = getEnglishLanguageUrl(captionsTracks)
          fetch(corsProxy + englishUrl, initial)
            .then(response => response.text())
            .then(transcript => {
              let timedTranscript = new Transcript(transcript)
              let searchResults = timedTranscript.FindQuery(searchContent)
              addSearchItemsToPopup(youtubeVideo, searchResults)
            })
        })
    })
  } else {
    //THROW SOME EXCEPTION OR DISPLAY TO USER
  }
})

let getEnglishLanguageUrl = captionsTracks => {
  return captionsTracks.find(track => track.languageCode === "en").baseUrl
}

let addSearchItemsToPopup = (youtubeUrl, searchResults) => {
  let matcheshtml = document.getElementById("listmatches")
  refreshList(matcheshtml)
  searchResults.forEach(result => {
    let timedUrl = youtubeUrl + "&t=" + result + "s"
    let listElement = document.createElement("li")

    let linkElement = document.createElement("a")
    linkElement.setAttribute("href", timedUrl)
    linkElement.innerText = timedUrl
    linkElement.onclick = redirectToNewUrl
    listElement.appendChild(linkElement)

    matcheshtml.appendChild(listElement)
  })
}

let refreshList = matcheshtml => {
  matcheshtml.innerHtml = ""
  matcheshtml.innerText = ""
}

let redirectToNewUrl = event => {
  chrome.tabs.update({ url: event.srcElement.text })
}
