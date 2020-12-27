"use strict";

const lowerFrequencyBounds = [10000, 5000, 2400, 1200, 600, 300, 160, 80, 40, 20];

/**
 * Reduces the data to just some important frequency intervals.
 * Important intervals are selected based on this Very Reliable source: https://blog.landr.com/sound-frequency-eq/
 * See FrequencySpectrumDivision.jpg in this repository also.
 *
 * @param buffer The frequency amplitude buffer.
 * @param highestFrequency The upper frequency bound of the buffer data.
 */
export function reduceFrequencies(buffer: Uint8Array, highestFrequency: number): Array<number> {
  const binWidthHz = highestFrequency / buffer.length;
  const newBuffer = lowerFrequencyBounds.map(() => 0); // Array of same size, filled with zeros.

  let currentBinLowerFrequency = 0;
  for (let entry of buffer) {
    const newBucket = lowerFrequencyBounds.findIndex(f => f <= currentBinLowerFrequency);
    newBuffer[newBucket] += entry;

    currentBinLowerFrequency += binWidthHz;
  }

  return newBuffer;
}

export function getFrequencyBounds() {
  return lowerFrequencyBounds;
}
