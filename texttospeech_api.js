async function main() {
  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');
  const fs = require('fs');

  // Creates a client
  const client = new speech.SpeechClient();

  const key = "narrative";
  var times = [];

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    uri: "gs://cmdfaudio/narrative.flac",
  };
  const config = {
    enableWordTimeOffsets: true,
    encoding: 'FLAC',
    sampleRateHertz: 22050,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };
  // Detects speech in the audio file. This creates a recognition job that you
  // can wait for now, or get its result later.
  const [operation] = await client.longRunningRecognize(request);
  // Get a Promise representation of the final result of the job
  const [response] = await operation.promise();
  response.results.forEach(result => {
    console.log(`Transcription: ${result.alternatives[0].transcript}`);
    result.alternatives[0].words.forEach(wordInfo => {
      if (key == wordInfo.word) {
        const startSecs =
        `${wordInfo.startTime.seconds}` +
        `.` +
        wordInfo.startTime.nanos / 100000000;
        times.push(startSecs);
      }
    });
  });
  times.forEach(element => {
    element = parseFloat(element);
    console.log(element);
  });
}
main().catch(console.error);