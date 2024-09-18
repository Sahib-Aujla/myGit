
1. Run `tsc-b && node app/main.js` to run your Git implementation, which is implemented
   in `app/main.ts`.


# Testing locally

The script is expected to operate on the `.git` folder inside
the current working directory. If you're running this inside the root of this
repository, you might end up accidentally damaging your repository's `.git`
folder.

I suggest executing the program in a different folder when testing
locally. For example:

```sh
mkdir -p /tmp/testing && cd /tmp/testing
/path/to/your/repo/tsc -b && node app/main.js init
```
