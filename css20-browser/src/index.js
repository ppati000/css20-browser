import "bootstrap";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles.scss";
import "regenerator-runtime/runtime";
import { reduceFrequencies, getFrequencyBounds } from "./audioProcessing";

"./audioProcessing";

// Hackity hack to get jQuery to work.
var jquery = require("jquery");
window.$ = window.jQuery = jquery;

import MobileDetect from "mobile-detect";
// import influent  funktioniert nicht, mit parcel weil es denkt, dass es unter node läuft

import influent from "influent/dist/influent.js";

// Wir speichern erstmal alle Events um sie dann asynchron zu schreiben
let evts = [];
let recording = null; //nur wenn wir aufnehmen

//  Ne statistik is nie schlecht
let data_count = 0;

// definiere mal wie oft ich pro Sekunde hochladen will....
const uploadsPerSecond = 0.1;

// Dummyfunktion falls jemand recorded bevor es los geht
var write = function () {
  document.getElementById("debug").innerHTML = "Error Not connected.";
  document.getElementById("record").checked = false;
};

jQuery(() => {
  // Wir schalten einen Timer an/aus mit der checkbox
  document.getElementById("record").onchange = function () {
    if (this.checked) {
      document.getElementById("subject").value = Math.floor(
        (1 + Math.random()) * 0x10000
      ).toString(16);

      recording = window.setInterval(write, 1000 / uploadsPerSecond);
      record();
      document.getElementById("debug").innerHTML = "Recording.";
    } else {
      window.clearInterval(recording);
      recording = null; //Schaltet auch die Speicherung ab
      document.getElementById("debug").innerHTML = "Not recording.";

      data_count = 0;
      evts = [];
    }
  };

  document.getElementById("subject").value = Math.floor(
    (1 + Math.random()) * 0x10000
  ).toString(16);
});

async function record() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  const analyzer = audioContext.createAnalyser();

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyzer);

  analyzer.smoothingTimeConstant = 0; // Use raw data, no averaging.
  analyzer.fftSize = 2048; // FFT windows size (number of samples).
  var bufferLength = analyzer.frequencyBinCount; // frequencyBinCount is automatically set to half the FFT window size.
  const sleepTime = (analyzer.fftSize / audioContext.sampleRate) * 1000;

  console.log(`Some info:
  Sample Rate: ${audioContext.sampleRate}
  FFT Size: ${analyzer.fftSize}
  New spectrum every ${sleepTime} ms.`);

  const data = new Uint8Array(bufferLength);
  await sleep(1000); // Wait an initial 1000ms to avoid browser quirks leading to no results.

  document.getElementById("debug").innerHTML =
    "Please wait... (" + data_count + ")";

  while (recording) {
    analyzer.getByteFrequencyData(data);

    const highestFrequency = audioContext.sampleRate / 2;
    const reduced = reduceFrequencies(data, highestFrequency);

    evts.push({
      timestamp: Date.now() * 1000000, // InfluxDb assumes nanosecond timestamps. Learned this the hard way.
      data: reduced
    });

    await sleep(sleepTime);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

//wir öffnen eine Verbindung zu unserem Server (https://github.com/gobwas/influent)
influent
  .createHttpClient({
    server: [
      {
        protocol: "https",
        host: "css20.dmz.teco.edu",
        port: 443
      }
    ],
    username: "css18",
    password: "css18",

    database: "browser"
  })
  .then(function (client) {
    write = function () {
      if (evts.length > 0) {
        let label = document.getElementById("label").value;

        var batch = new influent.Batch({ database: "browser" }); // da kommen alle zum versenden rein

        console.log(evts);

        for (let event of evts) {
          var measurement = new influent.Measurement("audio-patrick-3");
          measurement.setTimestamp(event.timestamp.toString());

          measurement.addTag("label", label);
          measurement.addTag("subject", document.getElementById("subject").value);
          measurement.addTag("useragent", window.navigator.userAgent);

          // Add main data.
          for (let i = 0; i < event.data.length; i++) {
            const frequencyBound = getFrequencyBounds()[i];
            measurement.addField(`frequency_${frequencyBound}`, new influent.I64(event.data[i]));
          }

          if (Object.keys(measurement.fields).length > 0) {
            //leere Messungen verursachen Fehler
            data_count++;
            batch.add(measurement);
          }
        }

        evts = []; //können wir jetzt löschen. Das tolle ist, dass jacascript singlethreaded ist!

        client.write(batch).then(function () {
          document.getElementById("debug").innerHTML =
            "Recorded... (" + data_count + ")"; //einfach nur um zu sehen, dass was passiert
        });

        document.getElementById("record").checked = false;
        document.getElementById("record").onchange();
      }
    };
  });
