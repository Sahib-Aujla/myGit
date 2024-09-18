import * as fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import simpleGit from "simple-git";
export function lsTree(args) {
    if (args.length < 3)
        throw new Error("You must specify command line arguments.");
    if (args[1] != "--name-only")
        throw new Error("Use  --name-only");
    let dirName = args[2].substring(0, 2);
    let fileName = args[2].substring(2);
    let buffer = fs.readFileSync(`.git/objects/${dirName}/${fileName}`);
    const decompressed = zlib.unzipSync(buffer);
    let ind = decompressed.indexOf("\0");
    let rest = decompressed.subarray(ind + 1);
    let dirs = [];
    while (true) {
        ind = rest.indexOf("\0");
        if (ind < 0)
            break;
        let n = rest.subarray(0, ind);
        let st = n.toString().split(" ");
        //console.log(st.join(" "));
        dirs.push(st[1]);
        rest = rest.subarray(ind + 1);
    }
    let ans = dirs.join("\n");
    ans += "\n";
    process.stdout.write(ans);
}
export function writeTree(args) {
    let sha = writeTreeObj(process.cwd());
    process.stdout.write(sha);
}
function writeTreeObj(basePath) {
    let res = [];
    const dirFiles = fs.readdirSync(basePath);
    for (let dirFile of dirFiles) {
        if (dirFile.includes(".git"))
            continue;
        if (fs.statSync(path.join(basePath, dirFile)).isDirectory()) {
            const dirSha = writeTreeObj(path.join(basePath, dirFile));
            let t = { mode: "40000", sha: dirSha, name: dirFile };
            res.push(t);
        }
        else {
            //if it is a file
            //read the content and create a sha
            let buffer = fs.readFileSync(path.join(basePath, dirFile)).toString();
            let sha = crypto.createHash("sha1");
            buffer = `blob ${buffer.length}\0` + buffer;
            sha.update(buffer);
            let sha2 = sha.digest("hex");
            const ubuf = zlib.deflateSync(buffer);
            let dName = sha2.toString().substring(0, 2);
            let fname = sha2.toString().substring(2);
            fs.mkdirSync(`.git/objects/${dName}`);
            fs.writeFileSync(`.git/objects/${dName}/${fname}`, ubuf);
            let t = { mode: "100644", sha: sha2, name: dirFile };
            res.push(t);
        }
    }
    const sortedEntries = res
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => {
        const hexHashToBuffer = Buffer.from(r.sha, "hex");
        const bufferone = Buffer.concat([
            Buffer.from(`${r.mode} ${r.name}\0`),
            hexHashToBuffer,
        ]);
        return bufferone;
    });
    let k = Buffer.concat(sortedEntries);
    let header = Buffer.from(`tree ${k.length}\0`);
    let full = Buffer.concat([header, k]);
    let sha = crypto.createHash("sha1").update(full).digest("hex").toString();
    const ubuf = zlib.deflateSync(full);
    let dName = sha.substring(0, 2);
    let fname = sha.substring(2);
    fs.mkdirSync(`.git/objects/${dName}`);
    fs.writeFileSync(`.git/objects/${dName}/${fname}`, ubuf);
    return sha;
}
export function commitTree(args) {
    let treeSha = args[1];
    let parSha = args[3];
    let message = args[5];
    let bf = Buffer.concat([
        Buffer.from(`tree ${treeSha}\n`),
        Buffer.from(`parent ${parSha}\n`),
        Buffer.from(`author <author@gmail.com> ${Date.now()} +0000\n`),
        Buffer.from(`commiter <author@gmail.com> ${Date.now()} +0000\n\n`),
        Buffer.from(`${message}\n`),
    ]);
    let header = Buffer.from(`commit ${bf.length}\0`);
    bf = Buffer.concat([header, bf]);
    let sha = crypto.createHash("sha1").update(bf).digest("hex");
    let dName = sha.substring(0, 2);
    let fName = sha.substring(2);
    let compressed = zlib.deflateSync(bf);
    fs.mkdirSync(`.git/objects/${dName}`);
    fs.writeFileSync(`.git/objects/${dName}/${fName}`, compressed);
    process.stdout.write(sha);
}
export async function copyFiles(args) {
    await simpleGit().clone(args[1], process.cwd() + `/${args[2]}`);
}
