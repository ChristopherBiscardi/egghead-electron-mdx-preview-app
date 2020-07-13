const React = require("react");
const ReactDOM = require("react-dom");
const { mdx, MDXProvider } = require("@mdx-js/react");
const htm = require("htm");
const { jsx } = require("@emotion/core");
const { ipcRenderer } = require("electron");

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

function openPreviewWindow() {
  ipcRenderer.send("open-preview");
}

const Write = (props) => {
  const { filename } = useContext(FileContext);

  return html`<div
    css=${{
      display: "grid",
      gridTemplateColumns: "1fr",
      fontSize: "20px",
    }}
  >
    <div><button onClick=${openPreviewWindow}>Preview Result</button></div>
    <textarea
      rows=${40}
      onChange=${(v) => {
        ipcRenderer.send("update-mdx", { filename, value: v.target.value });
      }}
    />
  </div>`;
};

// win.loadURL(`file://${__dirname}/app/index.html`)

const Home = (props) => {
  const navigate = useNavigate();
  const { setFilename } = useContext(FileContext);
  return html`<div>
    <button
      onClick=${async () => {
        console.log("create new mdx");
        const result = await dialog.showSaveDialog();
        if (result.canceled) {
          return;
        }
        const filename = result.filePath.endsWith(".mdx")
          ? result.filePath
          : `${result.filePath}.mdx`;
        console.log(filename);
        ipcRenderer.sendSync("create-mdx", { filename });
        setFilename(filename);
        navigate("/write", { replace: true });
      }}
    >
      Create New MDX
    <//>
  <//>`;
};

const FileContext = createContext({ filename: undefined });

const FileProvider = (props) => {
  const [filename, setFilename] = useState();
  return html`<${FileContext.Provider} value=${{ filename, setFilename }}
    >${props.children}<//
  >`;
};

ReactDOM.render(
  html`<${Router}>
    <${FileProvider}>
      <${Routes}>
        <${Route} path="/" element=${html`<${Home} />`} />
        <${Route} path="/write" element=${html`<${Write} />`} /> <//><//
  ><//>`,
  document.getElementById("corgis")
);
