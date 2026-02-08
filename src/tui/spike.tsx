import { render } from "@opentui/solid";

// A simple component to verify the setup
const App = () => (
  <box flexDirection="column" padding={1}>
    <text color="green">Hello World</text>
    <text>OpenTUI + Solid + Bun is working!</text>
  </box>
);

// Only render if this file is the main entry point
if (import.meta.main) {
  render(() => <App />);
}

export default App;
