const React = require("react");
const ReactDOM = require("react-dom");
const { mdx, MDXProvider } = require("@mdx-js/react");
const htm = require("htm");
const { jsx } = require("@emotion/core");
const { ipcRenderer } = require("electron");
const { ulid } = require("ulid");
const html = htm.bind(jsx);
const {
  HashRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} = require("react-router-dom");
const { dialog } = require("electron").remote;

const Router = HashRouter;
const {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useContext,
  createContext,
} = React;

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
      return html`<div>
        <p css=${{ color: "red" }}>${this.state.error.toString()}</p>
        <button onClick=${() => this.setState({ hasError: undefined })}>
          reset error
        </button>
      </div>`;
    }
    return this.props.children;
  }
}

const Preview = (props) => {
  const [PreviewValue, setValue] = useState();
  const [error, setError] = useState();
  useEffect(() => {
    console.log("useEffect");
    ipcRenderer.on("mdx-changed", async (event, arg) => {
      console.log("mdx-changed");
      if (arg.error) {
        setError(arg.error);
      } else {
        const importedMdx = await import(arg.mdxPreviewPath).catch((e) => {
          console.log(e);
        });
        setValue(importedMdx);
        setError();
      }
    });
  }, []);

  if (!PreviewValue) {
    return html`<div>asfklj</div>`;
  }
  return html`<${ErrorBoundary}>
    <div css=${{ padding: "1rem", color: error ? "red" : "inherit" }}>
      ${error ? error.message : "no errors"}
    </div>
    <${PreviewValue.default} />
  <//>`;
};

const PreviewPane = (props) => {
  return html`<div css=${{
    display: "grid",
    gridTemplateColumns: "1fr",
    fontSize: "20px",
  }}>
    <${MDXProvider}
      components=${{
        blockquote(props) {
          return html`<blockquote
            ...${props}
            className="nes-balloon from-left"
          />`;
        },
        ul(props) {
          return html`<ul ...${props} className="nes-list is-disc" />`;
        },
        button(props) {
          return html`<button ...${props} className="nes-btn" />`;
        },
      }}
    >
      <div css=${{ fontFamily: "sans-serif" }}>
        <${Preview} />
      </div>
    </MDXProvider>
  </div>`;
};

ReactDOM.render(html`<${PreviewPane} />`, document.getElementById("corgis"));
