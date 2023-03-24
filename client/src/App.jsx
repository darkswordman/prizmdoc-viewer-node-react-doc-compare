import React, { useState, useEffect } from "react";
import "./App.css";
import ErrorBanner from "./ErrorBanner";
import PrizmDocViewerWrapper from "./PrizmDocViewerWrapper";

function App() {
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [viewerControl, setViewerControl] = useState(null);

  const [currentPage, setCurrentPage] = useState();

  /** Used to subscribe to events when the viewer control is initialized */
  useEffect(() => {
    if (viewerControl !== null) {
      console.log("new event");

      // Set PageChanged event to react state, but it will refresh everything
      viewerControl.on("PageChanged", (e) => {
        setCurrentPage(e.pageNumber);
      });
    }
  }, [viewerControl]);

  // Ask the application server to create a viewing session for example.pdf.
  useEffect(() => {
    (async () => {
      try {
        // Tell the application server we want to begin viewing example.pdf. The
        // application server will create a new viewing session and return us
        // the viewingSessionId (which we need to instantiate the viewer below).
        const res = await fetch(`/compareDocuments?document=example.pdf`, {
          method: "POST",
        });

        // Make sure we received an HTTP 200 response.
        if (!res.ok) {
          throw new Error(
            `The request to the application server to create a new viewing session responded with: "${res.status} ${res.statusText}"`
          );
        }

        // Store the returned viewingSessionId so we can instantiate the viewer.
        setViewingSessionId((await res.json()).viewingSessionId);
      } catch (err) {
        setError(err);
      }
    })();
  }, []); // The empty array ensures this useEffect is only run once when the page first loads.

  // Render our page content.
  return (
    <>
      <h1>Hello PrizmDoc Viewer!</h1>

      <p>
        This is a minimal React application which integrates PrizmDoc Viewer.
        Node.js is used for an example application server. This application
        simply loads an example document with PrizmDoc Viewer, like this:
      </p>

      {!error && (
        <>
          <PrizmDocViewerWrapper
            viewingSessionId={viewingSessionId} // Use the viewingSessionId as input to construct the viewer.
            style={{ width: "100%", height: "600px" }} // Set the style of the container element which will become the viewer. The width and height will affect how much space the viewer will occupy.
            onViewerReady={setViewerControl} // Once the viewer is ready, update our component state to store a reference to the viewerControl so we can programmatically interact with it (see page navigation example below).
          />

          <div className="clientApiUsage">
            <p>
              And, once it is ready, you can programmatically interact with the
              viewer from a parent react component. Here are some buttons which
              make viewer API calls to perform programmatic page navigation:
            </p>
            <button
              disabled={!viewerControl}
              onClick={() => viewerControl.changeToPrevPage()}
            >
              Previous Page
            </button>
            <button
              disabled={!viewerControl}
              onClick={() => viewerControl.changeToNextPage()}
            >
              Next Page
            </button>
          </div>
        </>
      )}
      {error && <ErrorBanner message={error.toString()} />}

      <div style={{ display: "flex", width: "100%", flexDirection: 'column' }}>
        <div>
          <p>Current scale factor:</p>
          <input value={viewerControl?.getScaleFactor()} />
        </div>
        <div>
          <p>Get current page from getter function</p>
          <input value={viewerControl?.getPageNumber()} />
        </div>
        <div>
          <p>Current page from react state (if we don't add the 'currentPage' state, the viewerControl directive will not be reactive)</p>
          <input value={currentPage} />
        </div>
      </div>

      <h2>What Just Happened?</h2>

      <ol>
        <li>
          <p>
            The client-side react application asked the example application
            server to create a viewing session for a specific document:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.003.png"
              width="960"
              alt="React app asks for new viewing session"
            />
          </p>
        </li>
        <li>
          <p>
            The application server <code>POST</code>ed to PAS (PrizmDoc
            Application Services) to create a new viewing session (in this
            sample, the application server is a Node.js app, but your actual
            application server could be anything, like Java, .NET, etc.):
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.004.png"
              width="960"
              alt="POST /ViewingSession"
            />
          </p>
        </li>
        <li>
          <p>
            The application server received a <code>viewingSessionId</code> of{" "}
            <code style={{ fontWeight: "bold" }}>"{viewingSessionId}"</code>:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.005.png"
              width="960"
              alt="Receive viewingSessionId"
            />
          </p>
        </li>
        <li>
          <p>
            The application server sent the <code>viewingSessionId</code> to the
            client-side react application so that it could create the HTML
            viewer control:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.006.png"
              width="960"
              alt="Initialize viewer control with the viewingSessionId"
            />
          </p>
        </li>
        <li>
          <p>
            The application server uploaded the source document to PAS,
            associating that document with the viewing session:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.007.png"
              width="960"
              alt="Upload source document"
            />
          </p>
        </li>
        <li>
          <p>
            {" "}
            PAS handed this work off to the powerful PrizmDoc Server backend,
            which immediately began converting the document content to SVG, one
            page at a time:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.008.png"
              width="960"
              alt="Conversion starts"
            />
          </p>
        </li>
        <li>
          <p>
            Meanwhile, as soon as it had finished loading in the browser, the
            viewer began repeatedly asking PAS for the first page of document
            content:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.009.png"
              width="960"
              alt="Viewer requests first page"
            />
          </p>
        </li>
        <li>
          <p>
            As soon as the first page of SVG content was ready, PAS returned it
            to the viewer, allowing you to see the first page of the document:
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.010.png"
              width="960"
              alt="Viewer receives first page"
            />
          </p>
        </li>
        <li>
          <p>
            As you navigate through the document, the viewer will continue to
            request page content as needed.
          </p>
          <p>
            <img
              src="/images/viewing-sequence-diagrams/react-sample-diagrams.011.png"
              width="960"
              alt="Viewer continues making requests"
            />
          </p>
        </li>
      </ol>

      <h2>How Does the Viewer Reach PAS (PrizmDoc Application Services)?</h2>

      <p>
        To get document content, the viewer makes requests to PAS{" "}
        <i>through your web application</i> (or web server). That's why the
        example application server defines a proxy route to PAS at{" "}
        <code>server/pas-proxy/</code> (see <code>server/app.js</code> and
        <code>server/pas/createProxyRouteToPAS.js</code>). If you look at the
        network traffic in dev tools, you'll see the requests made by the viewer
        for resources rooted at this path.
      </p>

      <h2>Where to Next?</h2>

      <p>
        Check out the{" "}
        <a href="https://help.accusoft.com/PrizmDoc/latest/HTML/prizmdoc-overview.html">
          PrizmDoc Viewer product documentation
        </a>
        .
      </p>

      <p>
        Still need help? Contact{" "}
        <a href="https://www.accusoft.com/support">Accusoft Support</a>.
      </p>

      <br />
    </>
  );
}

export default App;
