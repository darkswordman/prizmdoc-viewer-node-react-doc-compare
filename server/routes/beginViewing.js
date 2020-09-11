const express = require('express');
const router = express.Router();
const joinPath = require('path').join;
const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const pas = require('../pas/pasRequest');

// This route will be called by the client whenever it needs to view a document.
// This route will contact PAS (part of the PrizmDoc Viewer backend) to create a
// new viewing session and return the new viewingSessionId to the client so that
// it can initialize the viewer.
//
// In this example Node.js application, this route accepts a document filename
// via a "document" query string parameter. In your actual application, you
// might choose to use some other document identifier, such as a database id.
// The key idea here is that this route gives the client a way to say "I need to
// create a viewer for document XYZ" (where XYZ is how you identify a document
// in your application) and receive back a new viewingSessionId which it can use
// to instantiate the viewer. This route handler is responsible for all of the
// communication with PAS to create the viewing session and upload the actual
// source document.
router.post('/beginViewing', async (req, res /*, next*/) => {
  let prizmdocRes;

  const document = req.query.document;

  // 1. Ask PAS to create a new viewing session.
  prizmdocRes = await pas.post('/ViewingSession', { // See https://help.accusoft.com/PrizmDoc/latest/HTML/pas-viewing-sessions.html#post-viewingsession
    json: {
      source: {
        type: 'upload',
        displayName: document
      }
    }
  });
  const viewingSessionId = prizmdocRes.body.viewingSessionId;

  // 2. Send the new viewingSessionId to the client so that it can begin rendering the viewer.
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ viewingSessionId }));
  res.end();

  // 3. Upload the actual source document to PAS so that it can start being
  //    converted to SVG. The viewer will request this content and receive it
  //    automatically once it is ready.
  prizmdocRes = await pas.put(`/ViewingSession/u${viewingSessionId}/SourceFile`, {
    body: await(readFileFromDocumentsDirectory(document))
  });
});

// Util function to read a document from the `documents/` directory
async function readFileFromDocumentsDirectory(filename) {
  return readFile(joinPath(__dirname, '..', 'documents', filename));
}

module.exports = router;
