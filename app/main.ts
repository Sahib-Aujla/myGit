import * as fs from "fs";
import zlib from "zlib";
import crypto from "crypto";
import { commitTree, copyFiles, lsTree, writeTree } from "./helper.js";
const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = "init",
  Cat = "cat-file",
  HashObject = "hash-object",
  LsTree = "ls-tree",
  WriteTree = "write-tree",
  CommitTree = "commit-tree",
  Clone = "clone",
}

switch (command) {
  case Commands.Init:
    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.log("Logs from your program will appear here!");

    // Uncomment this block to pass the first stage
    fs.mkdirSync(".git", { recursive: true });
    fs.mkdirSync(".git/objects", { recursive: true });
    fs.mkdirSync(".git/refs", { recursive: true });
    fs.writeFileSync(".git/HEAD", "ref: refs/heads/main\n");
    console.log("Initialized git directory");
    break;
  case Commands.Cat:
    if (args.length < 3)
      throw new Error("You must specify command line arguments.");
    if (args[1] != "-p") throw new Error("Use -p");
    let dir = args[2].substring(0, 2);
    let filePath = args[2].substring(2);
    const content = fs.readFileSync(`.git/objects/${dir}/${filePath}`);
    const decompressed = zlib.unzipSync(content);
    let ind = decompressed.indexOf("\0");
    const vals = decompressed.subarray(ind + 1).toString();
    process.stdout.write(vals);

    break;
  case Commands.HashObject:
    if (args.length < 3)
      throw new Error("You must specify command line arguments.");
    if (args[1] != "-w") throw new Error("Use -w");
    let buffer = fs.readFileSync(args[2]).toString();
    let sha = crypto.createHash("sha1");
    buffer = `blob ${buffer.length}\0` + buffer;
    sha.update(buffer);
    let sha2 = sha.digest("hex");
    const ubuf = zlib.deflateSync(buffer);
    let dName = sha2.toString().substring(0, 2);
    let fname = sha2.toString().substring(2);
    fs.mkdirSync(`.git/objects/${dName}`);
    fs.writeFileSync(`.git/objects/${dName}/${fname}`, ubuf);
    process.stdout.write(sha2);
    break;
  case Commands.LsTree:
    lsTree(args);
    break;
  case Commands.WriteTree:
    writeTree(args);
    break;
  case Commands.CommitTree:
    commitTree(args);
    break;
  case Commands.Clone:
    copyFiles(args);
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}
