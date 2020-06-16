const React = require("react");
const ReactDOM = require("react-dom");
const { mdx, MDXProvider } = require("@mdx-js/react");
const htm = require("htm");
const { jsx } = require("@emotion/core");
const { ipcRenderer } = require("electron");

const { ulid } = require("ulid");
const html = htm.bind(jsx);

const { useState, useCallback, useMemo, useEffect } = React;

const id = ulid();
const MarkdownWritingPlace = (props) => {
  return html`<textarea
    onChange=${(v) => {
      ipcRenderer.send("update-mdx", { id, value: v.target.value });
    }}
  />`;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log("componentDidCatch", error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return html`<h1>${this.state.error.toString()}</h1>`;
    }
    return this.props.children;
  }
}

const Preview = (props) => {
  const [PreviewValue, setValue] = useState();
  useEffect(() => {
    ipcRenderer.on("mdx-changed", async (event, arg) => {
      const importedMdx = await import(arg.mdxPreviewPath).catch((e) => {
        console.log(e);
      });
      setValue(importedMdx);
    });
  }, []);

  if (!PreviewValue) {
    return html`<div>asfklj</div>`;
  }
  return html`<${ErrorBoundary}><${PreviewValue.default} /><//>`;
};

ReactDOM.render(
  html`<div css=${{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    fontSize: "20px",
  }}>
    <${MarkdownWritingPlace} />
    <${MDXProvider}
      components=${{
        blockquote(props) {
          return html`<blockquote
            ...${props}
            css=${{
              borderLeft: "3px solid #1fa9f4",
              color: "#1a1a1a",
              fontSize: "1.25em",
              fontStyle: "italic",
              lineHeight: "1.8em",
              padding: "1em 2em",
              position: "relative",
              transition: ".2s border ease-in-out",
              zIndex: "0",
              "&:before": {
                content: "''",
                position: "absolute",
                top: "50%",
                left: "-4px",
                height: "2em",
                backgroundColor: "white",
                width: "5px",
                marginTop: "-1em",
              },
              "&:after": {
                content: '"“"',
                position: "absolute",
                top: "50%",
                left: "-0.5em",
                color: "#1fa9f4",
                fontFamily: "serif",
                fontStyle: "normal",
                lineHeight: "1em",
                textAlign: "center",
                textIndent: "-2px",
                width: "1em",
                marginTop: "-0.5em",
                transition: ".2s all ease-in-out, .4s transform ease-in-out",
              },
            }}
          />`;
        },
      }}
    >
      <div css=${{ fontFamily: "sans-serif" }}>
        <${Preview} />
      </div>
    </MDXProvider>
  </div>`,
  document.getElementById("corgis")
);
