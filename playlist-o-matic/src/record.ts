import {reduceFrequencies, getFrequencyBounds} from "./audioProcessing";
import {mean, variance} from "mathjs";

export async function recordAudioDataForClassification() {
  const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});

  // @ts-ignore
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  const analyzer = audioContext.createAnalyser();

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyzer);

  analyzer.smoothingTimeConstant = 0; // Use raw data, no averaging.
  analyzer.fftSize = 2048; // FFT windows size (number of samples).
  var bufferLength = analyzer.frequencyBinCount; // frequencyBinCount is automatically set to half the FFT window size.
  const sleepTime = (analyzer.fftSize / audioContext.sampleRate) * 1000;
  const numberOfRuns = (Math.ceil(audioContext.sampleRate / analyzer.fftSize)) * 5;

  console.log(`Some info:
  Sample Rate: ${audioContext.sampleRate}
  FFT Size: ${analyzer.fftSize}
  New spectrum every ${sleepTime} ms.
  Will collect ${numberOfRuns} data points for classification.`);

  const data = new Uint8Array(bufferLength);
  await sleep(1000); // Wait an initial 1000ms to avoid browser quirks leading to no results.

  const result: number[][] = [];
  const highestFrequency = audioContext.sampleRate / 2;
  for (let i = 0; i < numberOfRuns; i++) {
    await sleep(sleepTime);
    analyzer.getByteFrequencyData(data);
    result.push(reduceFrequencies(data, highestFrequency));
  }

  return transform(result);
}

function transform(result: number[][]) {
  const frequencies = getFrequencyBounds();
  const mappedResult: Record<string, number> = {};

  for (let i = 0; i < frequencies.length; i++) {
    mappedResult[`var_f_${frequencies[i]}`] = variance(result.map(r => r[i]));
    mappedResult[`mean_f_${frequencies[i]}`] = mean(result.map(r => r[i]));
  }

  return mappedResult;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
