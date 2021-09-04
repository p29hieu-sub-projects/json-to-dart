import { generateClass } from "./generateClass.js";
import { formatClassName, generateJsonDocument, sortJsonKey } from "./utils.js";

const generateJsonToDart = ({
  json = {},
  className = "class",
  nullable = true,
  includeExample = true,
  includeConstructor = true,
  isSortKey = false,
}) => {
  if (isSortKey) {
    json = sortJsonKey(json);
  }
  return `/// author: p29hieu
/// description: json to dart convert extension
///
///     ${formatClassName(className)}

${includeExample ? generateJsonDocument(json) : ""}

${generateClass({
  className,
  json,
  nullable,
  includeConstructor,
})}

`;
};

const jsonInputElement = document.getElementById("jsonInput");
const btnFormatEl = document.getElementById("btnFormat");
const exampleEl = document.getElementById("example");
const errorEl = document.getElementById("error");

const inputClassName = document.getElementById("inputClassName");
const optionsConvertEl = document.getElementById("optionsConvert");
const btnConvertEl = document.getElementById("btnConvert");
const dataConvertedEl = document.getElementById("dataConvertedContainer");

const includeExampleEl = document.getElementById("includeExample");
const includeConstructorEl = document.getElementById("includeConstructor");
const nullableEl = document.getElementById("nullable");

let isValidJsonInput = false;

const convertJson = (json) => {
  document.getElementById("textConverted").textContent = generateJsonToDart({
    json,
    className: inputClassName.value,
    includeExample: includeExampleEl.checked,
    includeConstructor: includeConstructorEl.checked,
    nullable: nullableEl.checked,
    isSortKey: document.getElementById("sortKey").checked,
  });
};

const formatJson = (textOnError) => {
  // console.log("formatJson: ", jsonInputElement.value, textOnError);
  try {
    const json = JSON.parse(jsonInputElement.value);
    errorEl.textContent = "";
    isValidJsonInput = true;
    inputClassName.setAttribute("style", "display: block");
    if (inputClassName.value.length > 0) {
      optionsConvertEl.setAttribute("style", "display: block");
      dataConvertedEl.setAttribute("style", "display: block");
      convertJson(json);
    }
    return json;
  } catch (e) {
    console.error(e);
    if (textOnError !== null && textOnError !== undefined) {
      jsonInputElement.value = textOnError;
    }
    errorEl.textContent = "ERROR: Error when format!";
    isValidJsonInput = false;
    inputClassName.setAttribute("style", "display: none");
    optionsConvertEl.setAttribute("style", "display: none");
    dataConvertedEl.setAttribute("style", "display: none");
    return null;
  }
};

const formatJsonInput = (onTextError = "") => {
  const json = formatJson(onTextError);
  jsonInputElement.value = JSON.stringify(json, null, 2);
};

// init
try {
  if (document.hasFocus()) {
    const clipboard = await navigator.clipboard.readText();
    jsonInputElement.value = clipboard;
    console.log({ clipboard: clipboard });
    formatJsonInput("");
  }
} catch (e) {
  console.error("error when read clipboard", e);
}

exampleEl.textContent = new Date().toTimeString();
setInterval(() => {
  exampleEl.textContent = new Date().toTimeString();
}, 1000);

jsonInputElement.addEventListener("input", () => formatJson());

// button format
btnFormatEl.addEventListener("click", () => formatJsonInput());

inputClassName.addEventListener("keyup", (e) => {
  if (e.target.value && isValidJsonInput) {
    optionsConvertEl.setAttribute("style", "display: block");
    dataConvertedEl.setAttribute("style", "display: block");
    return;
  }
  optionsConvertEl.setAttribute("style", "display: none");
});

// button convert
btnConvertEl.addEventListener("click", () => {
  const json = formatJson();
  if (!json) return;
  dataConvertedEl.setAttribute("style", "display:block");
});
