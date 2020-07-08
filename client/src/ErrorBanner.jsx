import React from 'react';

function ErrorBanner(props) {
  return (
    <div className="error">
      <h2>Uh oh!</h2>
      <p>
        There was an unexpected problem:
      </p>
      <pre>
        {props.message}
      </pre>
    </div>
  );
}

export default ErrorBanner;
