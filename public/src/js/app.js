var pwaCard = document.querySelector('#pwa');
var pwaCardContent = pwaCard.querySelector('.card__content');
var pwaCardDetails = pwaCard.querySelector('.card__details');
var detailsShown = false;

if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(function() {
      console.log('SW registered');
    });
}

pwaCard.addEventListener('click', function (event) {
  if (!detailsShown) {
    detailsShown = true;
    pwaCardContent.style.opacity = 0;
    pwaCardDetails.style.display = 'block';
    pwaCardContent.style.display = 'none';
    setTimeout(function () {
      pwaCardDetails.style.opacity = 1;
    }, 300);
  } else {
    detailsShown = false;
    pwaCardDetails.style.opacity = 0;
    pwaCardContent.style.display = 'block';
    pwaCardDetails.style.display = 'none';
    setTimeout(function () {
      pwaCardContent.style.opacity = 1;
    }, 300);
  }
});

// CAMERA & AUDIO
function getUserMedia(constraints) {
  // if Promise-based API is available, use it
  if (navigator.mediaDevices) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
    
  // otherwise try falling back to old, possibly prefixed API...
  var legacyApi = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
    
  if (legacyApi) {
    // ...and promisify it
    return new Promise(function (resolve, reject) {
      legacyApi.bind(navigator)(constraints, resolve, reject);
    });
  }
}

function getStream (type) {
  if (!navigator.mediaDevices && !navigator.getUserMedia && !navigator.webkitGetUserMedia &&
    !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
    alert('User Media API not supported.');
    return;
  }

  var constraints = {};
  constraints[type] = true;
  
  getUserMedia(constraints)
    .then(function (stream) {
      var mediaControl = document.querySelector(type);
      
      if ('srcObject' in mediaControl) {
        mediaControl.srcObject = stream;
      } else if (navigator.mozGetUserMedia) {
        mediaControl.mozSrcObject = stream;
      } else {
        mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
      }
      
      mediaControl.play();
    })
    .catch(function (err) {
      alert('Error: ' + err);
    });
}

// REALTIME COMMUNICATION
function getUserMedia1(options, successCallback, failureCallback) {
  var api = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if (api) {
    return api.bind(navigator)(options, successCallback, failureCallback);
  }
}

var pc1;
var pc2;
var theStreamB;

function getStream1() {
  if (!navigator.getUserMedia && !navigator.webkitGetUserMedia &&
    !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
    alert('User Media API not supported.');
    return;
  }
  
  var constraints = {
    video: true
  };
  getUserMedia1(constraints, function (stream) {
    addStreamToVideoTag(stream, 'localVideo');

    // RTCPeerConnection is prefixed in Blink-based browsers.
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    pc1 = new RTCPeerConnection(null);
    pc1.addStream(stream);
    pc1.onicecandidate = event => {
      if (event.candidate == null) return;
      pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
    };

    pc2 = new RTCPeerConnection(null);
    pc2.onaddstream = event => {
      theStreamB = event.stream;
      addStreamToVideoTag(event.stream, 'remoteVideo');
    };
    pc2.onicecandidate = event => {
      if (event.candidate == null) return;
      pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
    };

    pc1.createOffer({offerToReceiveVideo: 1})
      .then(desc => {
        pc1.setLocalDescription(desc);
        pc2.setRemoteDescription(desc);
        return pc2.createAnswer({offerToReceiveVideo: 1});
      })
      .then(desc => {
        pc1.setRemoteDescription(desc);
        pc2.setLocalDescription(desc);
      })
      .catch(err => {
        console.error('createOffer()/createAnswer() failed ' + err);
      });
  }, function (err) {
    alert('Error: ' + err);
  });
}

function addStreamToVideoTag(stream, tag) {
  var mediaControl = document.getElementById(tag);
  if ('srcObject' in mediaControl) {
    mediaControl.srcObject = stream;
  } else if (navigator.mozGetUserMedia) {
    mediaControl.mozSrcObject = stream;
  } else {
    mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
  }
}