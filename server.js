const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const pug = require('pug');

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// app.set("view engine", "pug");
// app.set("views", path.join(__dirname, "views"));

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname+'.flac')
  }
})
 
var times = [];
var upload = multer({ storage: storage })


app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
    uploadAudio();
    res.send(file)
  
})

app.post('/transcribe', (req, res) => {
  transcribe(req.body["key-val"]);
  
  //res.json(req.body);
  //res.render('index.html',{timestamps: times});
  res.send('Transcribed! <br> <a href="./index.html">Go Back</a>');


})

async function transcribe(keyToFind) {
    // Imports the Google Cloud client library
    const speech = require('@google-cloud/speech');
    const fs = require('fs');
  
    // Creates a client
    const client = new speech.SpeechClient();
  
    const key = keyToFind;
    // Clear the previous time array
    times = [];
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
    await response.results.forEach(result => {
      console.log(`Transcription: ${result.alternatives[0].transcript}`);
      result.alternatives[0].words.forEach(wordInfo => {
        if (key == wordInfo.word) {
          const startSecs =
          `${wordInfo.startTime.seconds}` +
          `.` +
          wordInfo.startTime.nanos / 100000000;
          times.push(parseFloat(startSecs));
        }
      });
    });
    times.forEach(element => {
      console.log(element);
    });
  }
  transcribe().catch(console.error);

  async function uploadAudio() {
    const {Storage} = require('@google-cloud/storage');

    // Creates a client
    const storage = new Storage();
    
    const bucketName = 'cmdfaudio';
    const audios = storage.bucket(bucketName);
    const filename = './uploads/myFile.flac';

    const options = {
      entity: 'allUsers',
      role: storage.acl.READER_ROLE
    };
    
    audios.acl.add(options, function(err, aclObject) {});
    
    //-
    // Make any new objects added to a bucket publicly readable.
    //-
    audios.acl.default.add(options, function(err, aclObject) {});
    
    // Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filename, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: {
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    console.log(`${filename} uploaded to ${bucketName}.`);

    const filename_bucket = 'myFile.flac';
    await storage
    .bucket(bucketName)
    .file(filename_bucket)
    .makePublic();

    console.log(`gs://${bucketName}/${filename} is now public.`);
  }


app.listen(3000, () => {
    console.log('app is running on port 3000');
});