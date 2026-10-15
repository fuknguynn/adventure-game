import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import './app/styles.css';
import { t } from './i18n';
const markTouch = () => document.body.classList.add('touch');
if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) markTouch();
window.addEventListener('touchstart', markTouch, { once: true, passive: true });
function Root() {
  if (typeof WebGLRenderingContext === 'undefined') {
    return <div className="screen"><div className="card"><h1>{t('ui.webgl.title')}</h1><p>{t('ui.webgl.text')}</p></div></div>;
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
