import { ExpoRoot } from 'expo-router';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

const ctx = require.context('./app', true, /\.(tsx?|jsx?)$/);

function App() {
  return <ExpoRoot context={ctx} />;
}

renderRootComponent(App);
