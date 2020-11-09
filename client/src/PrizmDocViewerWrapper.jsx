import React, { useEffect, useState, useRef } from 'react';

// The route you've configured in your web application to serve the static
// viewer-assets (JavaScript, CSS, etc.).
//
// In this sample, we've simply added these files to
// `client/public/viewer-assets`, ensuring they get added to the client build
// output in `build/viewer-assets`. The Node.js web application is then
// configured to serve all files in `client/build` (the entire React
// application) at the root route (`/`). So, for this sample, these files will
// be available at the base route `/viewer-assets`.
const VIEWER_ASSETS_BASE_ROUTE = '/viewer-assets';

// The route you've configured in your web application to act as a proxy to
// PAS (so the viewer can make HTTP requests to PAS, part of the PrizmDoc
// Viewer backend.)
//
// See `server/app.js` where this route is defined.
const PAS_PROXY_BASE_ROUTE = '/pas-proxy';

const PrizmDocViewerWrapper = props => {
  const [preRequisitesReady, setPreRequisitesReady] = useState(false);
  const [viewerConstructed, setViewerConstructed] = useState(false);
  const [preReqError, setPreReqError] = useState(null);
  const containerRef = useRef(null);

  const { onViewerReady, viewingSessionId } = props;

  // Ensure required JS and CSS are loaded.
  useEffect(function loadViewerPreRequisites() {
    (async () => {
      try {
        // These resources can be safely loaded in parallel.
        await Promise.all([
          injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewercontrol.js`),
          injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewerCustomizations.js`),
          injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/jquery-3.4.1.min.js`),
          injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/underscore.min.js`),
          injectCss(`${VIEWER_ASSETS_BASE_ROUTE}/css/viewer.css`),
          injectCss(`${VIEWER_ASSETS_BASE_ROUTE}/css/normalize.min.css`),
        ]);
        // These resources must be loaded last, and in this order.
        await injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/jquery.hotkeys.min.js`);
        await injectScript(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewer.js`);
        setPreRequisitesReady(true);
      } catch (err) {
        setPreReqError(err);
      }
    })();
  }, []); // The empty array ensures this useEffect hook is only executed once.

  // Initialize the viewer.
  useEffect(() => {
    if (preRequisitesReady && viewingSessionId && !viewerConstructed) {

      // This is where the non-React viewer is actually initialized, and where
      // you can customize the viewer construction options. See
      // https://help.accusoft.com/PrizmDoc/latest/HTML/external-jQuery.fn.html#~Options
      const container = window.$(containerRef.current).pccViewer({
        documentID: viewingSessionId,
        imageHandlerUrl: PAS_PROXY_BASE_ROUTE,                     // Base path the viewer should use to make requests to PAS (PrizmDoc Application Services).
        viewerAssetsPath: VIEWER_ASSETS_BASE_ROUTE,                // Base path the viewer should use for static assets
        resourcePath: `${VIEWER_ASSETS_BASE_ROUTE}/viewer-assets`, // Base path the viewer should use for images
        language: window.viewerCustomizations.languages['en-US'],
        template: window.viewerCustomizations.template,
        icons: window.viewerCustomizations.icons,
        annotationsMode: "LayeredAnnotations", // Use the new "LayeredAnnotations" system, which will persist annotation data as JSON (instead of the default "LegacyAnnotations" system, which uses a different XML format)
        redactionReasons: {
          enableRedactionReasonSelection: true, // Enable the UI to allow users to select a redaction reason.
          enableFreeformRedactionReasons: true, // Allow users to type a custom redaction reason.
          enableMultipleRedactionReasons: true, // Allow users to apply multiple redaction reasons to a single redaction (requires a backend running version 13.13 or higher)

          // TODO: Define your own set of redaction reasons for your users to pick from:
          reasons: [{
            reason: '1.a',                   // Text to apply to the redaction itself.
            description: 'Client Privilege'  // Optional extended description the user will see when choosing from the list of redaction reasons.
          }, {
            reason: '1.b',
            description: 'Privacy Information'
          }, {
            reason: '1.c'
          }]
        },
        uiElements: {
          attachments: true,                 // Enable the email attachments UI
          advancedSearch: true,              // Enable advanced search
        },
        immediateActionMenuMode: "hover",    // Enable immediate action menu
        attachmentViewingMode: "ThisViewer", // The email attachment will be opened in the same view
      });

      setViewerConstructed(true);

      // If an onViewerReady handler was provided, then call the handler with
      // the actual viewerControl instance once the viewer is ready.
      if (typeof(onViewerReady) === 'function') {
        container.viewerControl.on(window.PCCViewer.EventType.ViewerReady, () => {
          onViewerReady(container.viewerControl);
        });
      }
    }
  }, [preRequisitesReady, viewingSessionId, viewerConstructed, onViewerReady]);

  // Render the div tag which will be converted into the viewer.
  return (
    <>
      { !preReqError &&
        <div ref={containerRef} style={props.style} />
      }
      { preReqError &&
        <div className="error">
        <h2>Error Loading Viewer Prerequisites</h2>
        <p>
          There was a problem loading the required JavaScript and CSS files which the viewer depends on:
        </p>
        <pre>
          {preReqError.message}
        </pre>
        <p>
          Make sure that:
          <ul>
            <li>You have added the static <code>viewer-assets</code>directory to your web application.</li>
            <li>You have configured a static route in your web application to serve the <code>viewer-assets</code>.</li>
            <li>You have configured the <code>VIEWER_ASSETS_BASE_ROUTE</code> in <code>PrizmDocViewerWrapper.jsx</code> to use the correct base route to the static <code>viewer-assets</code>.</li>
          </ul>
        </p>
      </div>
      }
    </>
  );
}

function injectScript (src) {
  return injectHeadResource('script', 'src', src, { async: true });
}

function injectCss (href) {
  return injectHeadResource('link', 'href', href, { rel: 'stylesheet' });
}

function injectHeadResource (tagName, urlPropertyName, urlValue, attributes) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement(tagName);
    tag[urlPropertyName] = urlValue;

    for (const [k, v] of Object.entries(attributes || {})) {
      tag.setAttribute(k, v);
    }

    tag.onload = () => {
      tag.onerror = null;
      tag.onload = null;
      resolve(tag);
    }

    tag.onerror = () => {
      tag.onerror = null;
      tag.onload = null;
      reject(new Error(`Failed to load ${urlValue}`));
    }

    document.head.appendChild(tag);
  });
}

export default PrizmDocViewerWrapper;
