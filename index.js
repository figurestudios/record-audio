const client = new skynet.SkynetClient("https://siasky.net");

let recording;

const recordAudio = () =>
  new Promise(async resolve => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    const start = () => {
      recording = true;
      mediaRecorder.start();
    }

    const stop = () =>
      new Promise(resolve => {
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();
          resolve({ audioBlob, audioUrl, play });
        });

        mediaRecorder.stop();
      });

    resolve({ start, stop });
  });

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const handleAction = async () => {
  const recorder = await recordAudio();
  const actionButton = document.getElementById("action");
  actionButton.disabled = true;
  recorder.start();
  let loop = window.setInterval(async function() {
    if (!recording) {
      clearInterval(loop);
      const audio = await recorder.stop();
      audio.play();
      const reader = new FileReader();
      reader.readAsDataURL(audio.audioBlob);
      reader.onload = async () => {
        const base64AudioMessage = reader.result/*.split(',')[1]*/;
        upload(base64AudioMessage);
      }
      await sleep(1000);
      actionButton.disabled = false;
    } else {
      console.log("recording audio ...");
    }
  }, 500);
};

const stopRecording = () => recording = false;

const upload = async (base64AudioMessage) => {
  console.log("uploading audio ...");
  try {
    var file = new File([base64AudioMessage], "audio", {
      type: "audio/mpeg",
    });
    const { skylink } = await client.uploadFile(file);
    var paragraph = document.createElement("p");
    client.getSkylinkUrl(skylink).then(skylinkUrl => paragraph.innerText = skylinkUrl)
    document.getElementById("skylinks").append(paragraph)
  } catch (error) {
    console.log(error);
  }
};

const listen = async (skylink) => {
  await fetch(skylink+'/audio')
  .then(response => response.text())
  .then(data => audio = data);

  var audioObject = document.createElement("AUDIO");
  audioObject.src = audio;
  audioObject.play();
}

const load = () => {
  skylink = document.getElementById("audiolink").value;
  listen(skylink);
}
