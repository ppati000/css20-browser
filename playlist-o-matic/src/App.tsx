import React, {useState} from "react";
import {recordAudioDataForClassification} from "./record";
import decisionTree from "./decisionTree";
import logo from "./logo.svg";
import "./App.css";
import { mean, variance } from "mathjs";
import {getFrequencyBounds} from "./audioProcessing";
import playlists from "./playlists.json";
import {Simulate} from "react-dom/test-utils";

function App() {
  const [detecting, setDetecting] = useState(false);
  const [classification, setClassification] = useState({ genre: "", confidence: 0 });

  function onPress() {
    setClassification({ genre: "", confidence: 0 });
    setDetecting(true);
    recordAudioDataForClassification()
    .then(result => decisionTree(result) as Record<string, number>)
    .then(result => {
      let bestResult = { genre: "", confidence: 0 };
      for (let key of Object.keys(result)) {
        console.log(result[key]);
        if (result[key] > bestResult.confidence) {
          bestResult = { genre: key, confidence: result[key] };
        }
      }

      setClassification(bestResult);
      setDetecting(false);
    })
      .catch(err => {
        setDetecting(false);
        console.error(err);
      });
  }

  const playlist = playlists.playlists.find(p => p.genre === classification.genre);

  return (
    <div className="App">
      <p>Your Playlist Recommendation</p>
      <button className="detectButton" onClick={onPress}>Show Playlist</button>

      { detecting && <p>Listening...</p> }

      { classification && classification.genre === "silence" && <p>I don't think you're listening to anything right now. Check your microphone maybe?</p>}

      { classification && classification.confidence > 0 && playlist && <p>I'm {Math.round(classification.confidence * 100)}% sure you'll like this playlist.</p> }

      { classification && classification.genre && playlist &&
      <iframe src={playlist.link} width={300} height={600} frameBorder={0}
  allowTransparency={true} allow="encrypted-media"/>
      }
    </div>
  );
}

export default App;
