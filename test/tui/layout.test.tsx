import { describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import App from "../../src/tui/app";

describe("TUI Layout", () => {
  test("renders 2-panel layout with Sidebar and Main Content", async () => {
    const { captureCharFrame } = await testRender(<App />, {});
    
    // Allow a tick for rendering
    await new Promise(resolve => setTimeout(resolve, 0));

    const output = captureCharFrame();
    console.log("Captured Output:\n" + output);

    expect(output).toContain("Surahs");
    expect(output).toContain("Al-Fatihah");
  });
});
