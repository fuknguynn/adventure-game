import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import './app/styles.css';

function Root() {
  if (typeof WebGLRenderingContext === 'undefined') {
    return <div className="screen"><div className="card"><h1>WebGL unavailable</h1><p>Eldergrove needs WebGL. Please try a recent Chrome, Edge, Firefox or Safari with hardware acceleration on.</p></div></div>;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
