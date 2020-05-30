const path = require('path');
const fs = require('fs');
const ncp = require('ncp');

const source = path.resolve(process.cwd(), 'src');
const dest = path.resolve(process.cwd(), 'lib');

if (fs.existsSync(dest)) {
    fs.rmdirSync(dest, { recursive: true });
}

fs.mkdirSync(dest);

ncp(source, dest, (err) => {
    if (err) {
        return console.log(err);
    }
    console.log('Done');
});