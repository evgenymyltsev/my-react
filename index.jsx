const React = {
  createElement: (tag, props, ...children) => {
    if (typeof tag === "function") {
      try {
        return tag(props);
      } catch ({ promise, key }) {
        promise.then((data) => {
          promiseCache.set(key, data);
          rerender();
        });
        return { tag: "div", props: { children: ["loading"] } };
      }
    }

    const element = { tag, props: { ...props, children } };

    return element;
  },
};

const render = (reactElement, container) => {
  if (typeof reactElement === "string" || typeof reactElement === "number") {
    container.appendChild(document.createTextNode(String(reactElement)));

    return;
  }

  const domElement = document.createElement(reactElement.tag);

  if (reactElement.props) {
    Object.keys(reactElement.props)
      .filter((p) => p !== "children")
      .forEach((p) => (domElement[p] = reactElement.props[p]));
  }

  if (reactElement.props.children) {
    reactElement.props.children.forEach((child) => render(child, domElement));
  }

  container.appendChild(domElement);
};

const states = [];
let statesIndex = 0;

const useState = (initialState) => {
  const currentStateIndex = statesIndex;
  states[currentStateIndex] = states[currentStateIndex] || initialState;

  const setState = (newState) => {
    states[currentStateIndex] = newState;
    rerender();
  };

  statesIndex++;

  return [states[currentStateIndex], setState];
};

const useEffect = (callback, dependencyArray) => {
  let hasChanged = true;
  const currentStateIndex = statesIndex;
  const oldDependency = states[currentStateIndex];

  console.log(oldDependency, dependencyArray);

  if (oldDependency) {
    hasChanged = false;

    dependencyArray.forEach((dependency, index) => {
      if (!Object.is(oldDependency[index], dependency)) {
        hasChanged = true;
      }
    });
  }

  if (hasChanged) {
    callback();
  }

  states[currentStateIndex] = dependencyArray;
  statesIndex++;
};

const promiseCache = new Map();
const createResource = (promise, key) => {
  if (promiseCache.has(key)) {
    return promiseCache.get(key);
  }

  throw { promise, key };
};

const App = () => {
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(0);
  const post = createResource(
    fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((response) => response.json())
      .then((json) => json),
    "post"
  );

  useEffect(() => console.log("effect"), [count]);

  return (
    <div className="container">
      <h3>Count is: {count}</h3>
      <div>
        <button onclick={() => setCount(count + 1)}>plus</button>
        <button onclick={() => setCount(count - 1)}>minus</button>
      </div>

      <input
        value={title}
        onchange={(e) => setTitle(e.target.value)}
        type="text"
        placeholder="title"
      />
      <h1>{title}</h1>
      <p>{post.title}</p>
    </div>
  );
};

const rerender = () => {
  statesIndex = 0;
  document.querySelector("#app").firstChild.remove();
  render(<App />, document.querySelector("#app"));
};

render(<App />, document.querySelector("#app"));
