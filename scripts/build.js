/*
 * covid-19-config-mongo
 * Copyright (C) 2020 Craig Miller
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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