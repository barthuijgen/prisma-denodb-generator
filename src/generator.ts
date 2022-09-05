import * as prettier from "prettier";
import { DMMF } from "@prisma/generator-helper";

const denoDbImoport = "https://deno.land/x/denodb@v1.0.40/mod.ts";

function isFieldDefaultObject(
  _default: DMMF.Field["default"]
): _default is DMMF.FieldDefault {
  return typeof _default === "object";
}

var getClassName = function camalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
};

function hasModelDefaults(model: DMMF.Model) {
  return model.fields.some((field) => field.default);
}

function parseField(field: DMMF.Field, dmmf: DMMF.Document) {
  let typescript = `${field.name}: {\n`;

  if (field.kind === "enum") {
    const enumValues = dmmf.schema.enumTypes.model
      .find((x) => x.name === field.type)
      .values.map((value) => `"${value}"`);
    typescript += `
    type: DataTypes.ENUM,
    values: [${enumValues.join(",")}],
    `;
  } else if (field.kind === "scalar") {
    switch (field.type) {
      case "Int":
        if (
          isFieldDefaultObject(field.default) &&
          field.default.name === "autoincrement"
        ) {
          typescript += `
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        `;
        } else {
          typescript += "type: DataTypes.INTEGER,";
        }
        break;
      case "Float":
        typescript += "type: DataTypes.FLOAT,";
        break;
      case "String":
        typescript += "type: DataTypes.STRING,";
        break;
      default:
        console.log("parseField MISSING", field.name, field.type);
        console.log(field);
        typescript += "type: DataTypes.STRING,";
        break;
    }
  } else {
    console.log("UNKNOWN FIELD KIND", field);
  }

  typescript += `allowNull: ${!field.isRequired},`;

  if (field.documentation) {
    // TODO: escape string
    typescript += `comment: "${field.documentation}",`;
  }

  if (field.isUnique) {
    typescript += "unique: true,";
  }
  typescript += `}`;
  return typescript;
}

function parseFieldDefault(field: DMMF.Field) {
  if (
    isFieldDefaultObject(field.default) &&
    field.default.name === "autoincrement"
  ) {
    return null;
  }
  let typescript = `${field.name}: `;
  switch (field.type) {
    case "Int":
      if (
        isFieldDefaultObject(field.default) &&
        field.default.name !== "autoincrement"
      ) {
        typescript += "DataTypes.INTEGER";
      } else {
        typescript += field.default;
      }
      break;
    case "String":
      typescript += JSON.stringify(field.default);
      break;
    case "Float":
      typescript += field.default;
      break;
    default:
      console.log(
        "parseFieldDefault MISSING",
        field.name,
        field.type,
        field.default
      );
      typescript += "DataTypes.STRING";
      break;
  }
  return typescript;
}

export function generate(dmmf: DMMF.Document) {
  let typescript = `
  import { DataTypes, Model, Database } from '${denoDbImoport}';
  `;

  dmmf.datamodel.models.forEach((model) => {
    typescript += `
      export class ${getClassName(model.name)} extends Model {
          static table = '${model.name}';
          static timestamps = true;

          static fields = {
            ${model.fields.map((field) => parseField(field, dmmf)).join(",\n")}
          };

          ${
            hasModelDefaults
              ? `
          static defaults = {
            ${model.fields
              .filter((field) => field.hasDefaultValue)
              .map(parseFieldDefault)
              .filter((field) => field)
              .join(", ")}
          }`
              : ""
          }
          
      }

      export function link(db: Database) {
        db.link([${dmmf.datamodel.models
          .map((model) => getClassName(model.name))
          .join(", ")}]);
      }
      `;
  });

  return prettier.format(typescript, { parser: "typescript" });
}
