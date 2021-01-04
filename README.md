# Playlist-o-matic

Playlist-o-matic is a context-sensitive React app which detects music genres and recommends a playlist based on the detected genre.
The app uses a decision tree machine learning model.

<p float="left">
<img src="https://github.com/ppati000/playlist-o-matic/blob/master/IMG_3894.PNG?raw=true" alt="Playlist-o-matic application when no music is playing." height="400">
<img src="https://github.com/ppati000/playlist-o-matic/blob/master/IMG_3895.PNG?raw=true" alt="Playlist-o-matic application when country music is playing." height="400">
<img src="https://github.com/ppati000/playlist-o-matic/blob/master/IMG_3896.PNG?raw=true" alt="Playlist-o-matic application when reggaeton music is playing." height="400">
</p>

This is a proof-of-concept application. At the moment, only the two beautiful genres of Country and Reggaeton are supported. Additionally, the app is able to recognize silence.
Please note that accuracy may vary based on your sound system.
All recordings were made using [one of those neat speakers](https://www.harmankardon.de/tragbare-lautsprecher-und-lautsprecher-fur-den-heimgebrauch/HK+GO+PLAY.html).

The model included in the application is based on the first 20 songs of each of the following two playlists:
* [Reggaeton playlist](https://open.spotify.com/playlist/0LvL28jH4syAESZvrvtJhX?si=eLWcrNdETBO6iqKk7ZBHaw)
* [Country playlist](https://open.spotify.com/playlist/0LvL28jH4syAESZvrvtJhX?si=cWXiSkWKS0mZKaGDREDRrg)

Additionally, a few "recordings" of silence were made so that the app does not suggest anything if no music is playing.

## Overview

This repository contains two directories. [`css-20-browser`](https://github.com/ppati000/playlist-o-matic/tree/master/css20-browser) for data collection and [`playlist-o-matic`](https://github.com/ppati000/playlist-o-matic/tree/master/playlist-o-matic) which contains the actual app.

### How to Run
You need Node.js installed on your machine.

1. Either `cd css20-browser` for data collection or `cd playlist-o-matic`.
2. `npm start`
3. Open `localhost:1234` or `localhost:3000` in your browser.

### Running on a mobile device
You may need to access the app over HTTPS in order to get microphone access. On your computer, use [ngrok](https://ngrok.com/download) to open an HTTPS tunnel to localhost (`ngrok http 1234` or `ngrok http 3000`).

## Data Collection

The data collection logic records audio and performs a Fast Fourier Transform (FFT) to convert it to the frequency domain.
Because this usually leads to very fine-grained frequency binning, the data is further grouped according to important frequency bands. These are shown in the following picture:

<img src="https://github.com/ppati000/playlist-o-matic/blob/master/css20-browser/FrequencySpectrumDivision.jpg?raw=true" alt="Important frequency bands for music." width="400" height="400">

### Sampling window

The FFT is run with a window size of 2048 samples. The sampling rate is determined by your hardware. This will determine how often a data entry (spectrum) is generated. Consider the browser's output on my machine:

```Some info:
  Sample Rate: 48000
  FFT Size: 2048
  New spectrum every 42.666666666666664 ms.
```

### Storage

The collected and aggregated data is stored in an InfluxDB database.

## Data Analysis

The data analysis is performed in R; see the `Classification.Rmd` file. A simple decision tree model is used, which is exported to PMML and then converted into JSON.

Some experiments were conducted using random forests, too.
These are in `Classification-randomForest-unused.Rmd`.
As the filename suggests, the results have not been used in the application yet.

The recorded frequency data is used to build features based on mean and variance of the different frequency bands.
This means that the data is windowed a second time, this time using timestamps so that data representing one second of music is used.

## Playlist-o-matic application

The actual application is based on React. It records audio and transforms it in the same way as the data collection logic. Then, it calculates mean and variance of the frequency bands based on the same one-second windowing as the R-based data analysis.

The decision tree JSON is recursively walked down until a decision is made. The detected genre as well as its probability are then displayed in the app.
