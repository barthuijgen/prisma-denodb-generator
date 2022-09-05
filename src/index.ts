import * as fs from "fs/promises";
import * as path from "path";
import { parseEnvValue } from "@prisma/sdk";
import { generatorHandler } from "@prisma/generator-helper";
import { generate } from "./generator";

generatorHandler({
  onManifest() {
    return {
      defaultOutput: "./denodb",
      prettyName: "Prisma DenoDB client Generator",
    };
  },
  async onGenerate(options) {
    if (!options.generator.output) {
      throw new Error("No output was specified for Prisma Schema Generator");
    }

    const outputDir =
      // This ensures previous version of prisma are still supported
      typeof options.generator.output === "string"
        ? (options.generator.output as unknown as string)
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          parseEnvValue(options.generator.output);
    try {
      await fs.mkdir(path.dirname(outputDir), {
        recursive: true,
      });
      fs.writeFile("./dump.json", JSON.stringify(options.dmmf));
      const output = generate(options.dmmf);
      const filename = outputDir.endsWith(".ts")
        ? outputDir
        : path.join(outputDir, "index.ts");
      await fs.writeFile(filename, output);
    } catch (e) {
      console.error("Error: unable to write files for Prisma Schema Generator");
      throw e;
    }
  },
});
