import React from 'react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : 'Something went wrong.' };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={styles}>
          <h1>Eldergrove hit a snag</h1>
          <p>{this.state.error}</p>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles: React.CSSProperties = { color: '#f4e9c9', background: '#15251e', minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 };
