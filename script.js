const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
let peerConnection;

// Replace these URLs with your signaling server's URL
const socket = new WebSocket('wss://your-signaling-server-url');

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'offer') {
    handleOffer(message);
  } else if (message.type === 'answer') {
    handleAnswer(message);
  } else if (message.type === 'candidate') {
    handleCandidate(message);
  } else if (message.type === 'chat') {
    addChatMessage(message.sender, message.text);
  }
};

function handleOffer(offer) {
  // Set up local peer connection
  peerConnection = new RTCPeerConnection();
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.ontrack = handleTrackEvent;

  // Set remote description
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  // Create answer and set local description
  peerConnection.createAnswer().then((answer) => {
    peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify(answer));
  }).catch(error => console.error(error));
}

function handleAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.send(JSON.stringify(event.candidate));
  }
}

function handleTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0];
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text !== '') {
    addChatMessage('You', text);
    const message = {
      type: 'chat',
      sender: 'You',
      text: text,
    };
    socket.send(JSON.stringify(message));
    messageInput.value = '';
  }
}

function addChatMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = `${sender}: ${text}`;
  messagesDiv.appendChild(messageDiv);
}

// Get user media and set local video stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error(error));