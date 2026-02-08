import { describe, expect, test } from "bun:test";
import { testRender } from "@opentui/solid";
import App from "../src/tui/spike";

describe("TUI Spike", () => {
  test("renders hello world", async () => {
    const { captureCharFrame } = await testRender(App);
    
    // Give it a tick to render effects? (Though testRender awaits setup)
    await new Promise(resolve => setTimeout(resolve, 0));

    const output = captureCharFrame();
    console.log("Captured Output:\n" + output);

    expect(output).toContain("Hello World");
    expect(output).toContain("OpenTUI + Solid + Bun is working!");
  });
});
