import fs from "node:fs";
import path from "node:path";

import { schemaRegistry, type SchemaKey } from "./schemaRegistry";

function main() {
  const args = process.argv.slice(2);
  const key = args[0] as SchemaKey | undefined;

  // === Validation ===
  if (!key) {
    console.error("スキーマ名を指定してください");
    console.error("例: npm run gen:json -- hearingJson");
    process.exit(1);
  }

  //  === Func1: 引数のリスト出力 ===
  if (args.includes("list")) {
    console.log("サンプル出力可能なスキーマ一覧:");
    Object.keys(schemaRegistry).forEach((k) => console.log(`- ${k}`));
    process.exit(0);
  }

  // === Func2: サンプル出力 ===
  // スキーマ
  const entry = schemaRegistry[key];

  if (!entry) {
    console.error(`不明なスキーマ: ${key}`);
    console.error(
      `サンプル出力可能なスキーマ一覧: ${Object.keys(schemaRegistry).join(", ")}`,
    );
    process.exit(1);
  }

  const sample = entry.schema.parse(undefined);

  // ファイル出力
  const outDir = path.resolve(process.cwd(), "dst/");
  const outPath = path.join(outDir, entry.output);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(sample, null, 2), "utf-8");

  console.log(`✅ generated: ${outPath}`);
}

main();
