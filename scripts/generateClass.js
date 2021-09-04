import {
  camelize,
  formatClassName,
  getCastFromJson,
  getCastToJson,
  getFieldType,
} from "./utils.js";

const generateClassFields = ({ className, json, nullable }) => {
  let fields = Object.keys(json).map((fieldName) => {
    const fieldType = getFieldType({
      fieldData: json[fieldName],
      fieldName,
      parentClassName: className,
    });
    nullable = nullable ? "?" : "";
    fieldName = camelize(fieldName);
    return `late ${fieldType}${nullable} ${fieldName};`;
  });
  return fields.join("\n  ");
};

const generateConstructor = ({ className, json, nullable }) => {
  return `
  ${className}({
${Object.keys(json)
  .map((key) => {
    let result =
      "    " + (nullable ? "" : "required ") + "this." + camelize(key) + ",";
    return result;
  })
  .join("\n")}
  });`;
};

const generateFromJsonFunction = ({ className, json, nullable }) => {
  const jsonField = Object.keys(json).map((key) => {
    return `    if(json["${key}"] != null) this.${camelize(
      key
    )} = ${getCastFromJson({
      parentClassName: className,
      fieldName: key,
      fieldData: json[key],
    })};`;
  });
  return `
  ${className}.fromJson(Map<String, dynamic> json) {
${jsonField.join("\n")}
  }`;
};

const generateToJsonFunction = ({ className, json, nullable }) => {
  const jsonField = Object.keys(json).map((key) => {
    return `    if(this.${camelize(key)} != null) ${getCastToJson({
      parentClassName: className,
      fieldName: key,
      fieldData: json[key],
      nullable,
    })};`;
  });
  return `
  Map<String, dynamic> toJson() {
    Map<String, dynamic> result = {};
${jsonField.join("\n")}
    return result;
  }`;
};

const generateClass = ({ className, json, nullable, includeConstructor }) => {
  const classNameFormatted = formatClassName(className);
  const classChildren = Object.keys(json)
    .map((key) => {
      if (typeof json[key] === "object" && !Array.isArray(json[key]))
        return generateClass({
          className: classNameFormatted + " " + key,
          json: json[key],
          nullable,
          includeConstructor,
          sortKey,
        });
      if (Array.isArray(json[key]) && typeof json[key][0] === "object")
        return generateClass({
          className: classNameFormatted + " " + key,
          json: json[key][0],
          nullable,
          includeConstructor,
          sortKey,
        });
    })
    .filter((e) => !!e);

  const constructorClass = includeConstructor
    ? generateConstructor({
        className: classNameFormatted,
        json,
        nullable,
      })
    : "";

  const fromJsonFunction = generateFromJsonFunction({
    className: classNameFormatted,
    json,
    nullable,
  });

  const toJsonFunction = generateToJsonFunction({
    className: classNameFormatted,
    json,
    nullable,
  });

  return `class ${classNameFormatted} {
  ${generateClassFields({ className: classNameFormatted, json, nullable })}
  ${constructorClass}
  ${fromJsonFunction}
  ${toJsonFunction}
}

${classChildren.join("")}`;
};

export { generateClass };
