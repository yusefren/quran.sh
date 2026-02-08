import { Component, JSX } from "solid-js";
import { SurahList } from "./surah-list";
import { useRoute } from "../router";

export const Layout: Component<{ sidebar?: JSX.Element; children?: JSX.Element }> = (props) => {
  const { navigate } = useRoute();

  return (
    <box flexDirection="row" width="100%" height="100%">
      {/* Sidebar - 30% width */}
      <box width="30%" borderStyle="single" borderColor="cyan">
        <text bold color="cyan">
          Sidebar
        </text>
        {props.sidebar || <SurahList onSelect={(id) => navigate(`/surah/${id}`)} />}
      </box>

      {/* Main Content - 70% width */}
      <box width="70%" borderStyle="single" borderColor="green" padding={1}>
        <text bold color="green">
          Main Content
        </text>
        {props.children}
      </box>
    </box>
  );
};
