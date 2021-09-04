function camelize(str = "") {
  return str
    .split(/(?:[-._\s]{1,})/g)
    .filter((text) => !!text)
    .map((text, index) =>
      index === 0
        ? text.charAt(0).toLowerCase() + text.substr(1)
        : text.charAt(0).toUpperCase() + text.substr(1)
    )
    .join("");
}

const formatClassName = (className) => {
  const _ = `${camelize(className)}`;
  return _.charAt(0).toLocaleUpperCase() + _.substr(1);
};

/**
 * @returns "dynamic" | "List<dynamic>" | "List<${itemType}>" | "${fieldName}" | "DateTime" | "String" | "bool" | "int" | "double"
 */

const getFieldType = ({ fieldData, fieldName, parentClassName }) => {
  if (fieldData === undefined || fieldData === null) {
    return "dynamic";
  }
  switch (typeof fieldData) {
    case "object":
      if (Array.isArray(fieldData)) {
        if (fieldData.length === 0) return "List<dynamic>";
        const itemType = getFieldType({
          fieldData: fieldData[0],
          fieldName,
          parentClassName: parentClassName,
        });
        return `List<${itemType}>`;
      }
      return `${parentClassName}${formatClassName(fieldName)}`;
    case "string":
      if (Date.parse(fieldData).toPrecision() !== "NaN") {
        return "DateTime";
      }
      return "String";
    case "boolean":
      return "bool";
    case "number":
      if (parseInt(fieldData) === fieldData) return "int";
      return "double";
    default:
      return "dynamic";
  }
};

const getCastFromJson = ({ fieldData, fieldName, parentClassName }) => {
  const fieldType = getFieldType({ fieldData, fieldName, parentClassName });
  switch (fieldType) {
    case "DateTime":
      return `DateTime.tryParse(json["${fieldName}"])`;
    case "String":
    case "dynamic":
      return `json["${fieldName}"]`;
    case "bool":
      return `json["${fieldName}"] as bool`;
    case "int":
      return `int.parse(json["${fieldName}"], onError: (_)=> 0)`;
    case "double":
      return `double.parse(json["${fieldName}"], (_)=> 0)`;
    case "List<dynamic>":
      return `json["${fieldName}"] as List<dynamic>`;
    default:
      if (`${fieldType}`.includes("List<")) {
        const childType = getFieldType({
          fieldData: fieldData[0],
          fieldName,
          parentClassName,
        });
        if (
          !childType.includes("List") &&
          childType.includes(parentClassName)
        ) {
          return `(json["${fieldName}"] as List).map((el) => ${childType}.fromJson(el)).toList()`;
        }
        return `json["${fieldName}"] as List<${childType}>`;
      }
      return `${parentClassName}${formatClassName(
        fieldName
      )}.fromJson(json["${fieldName}"])`;
  }
};

const getCastToJson = ({ fieldData, fieldName, parentClassName, nullable }) => {
  const fieldType = getFieldType({ fieldData, fieldName, parentClassName });
  switch (fieldType) {
    case "DateTime":
      return `result["${fieldName}"] = this.${camelize(fieldName)}${
        nullable ? "!" : ""
      }.toIso8601String()`;
    case "String":
    case "int":
    case "double":
    case "bool":
    case "dynamic":
      return `result["${fieldName}"] = this.${camelize(fieldName)}`;
    case "List<dynamic>":
      return `result["${fieldName}"] = this.${camelize(fieldName)}${
        nullable ? "!" : ""
      }.toString()`;
    default:
      if (`${fieldType}`.includes("List<")) {
        return `result["${fieldName}"] = this.${camelize(fieldName)}${
          nullable ? "!" : ""
        }.map((el) => ${getCastToJson({
          parentClassName: parentClassName,
          fieldName,
          fieldData: fieldData[0],
          nullable,
        })}).toList()`;
      }
      return `result["${fieldName}"] = this.${camelize(fieldName)}${
        nullable ? "!" : ""
      }.toJson()`;
  }
};

const generateJsonDocument = (json) => {
  return `/// Example:
///  ${JSON.stringify(json, null, 2).replaceAll("\n", "\n/// ")}`;
};

const sortJsonKey = (json) => {
  const jsonSortKeys = {};
  Object.keys(json)
    .sort()
    .forEach((key) => {
      if (typeof json[key] === "object")
        jsonSortKeys[key] = sortJsonKey(json[key]);
      else jsonSortKeys[key] = json[key];
    });
  return { ...jsonSortKeys };
};

export {
  camelize,
  formatClassName,
  getFieldType,
  getCastFromJson,
  getCastToJson,
  generateJsonDocument,
  sortJsonKey,
};
