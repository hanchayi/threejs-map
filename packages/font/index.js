var Fontmin = require('fontmin');
var nantong = require('geo/nantong.json')
const _ = require('lodash')

let text = ''
nantong.features.forEach(f => {
  text += f.properties.name
})

text = _.uniq(text.split('')).join('')
console.log(text)

var fontmin = new Fontmin()
    .src('./HarmonyOS Sans/HarmonyOS_Sans_SC/HarmonyOS_Sans_SC_Regular.ttf')
    .use(Fontmin.glyph({
        text,
        hinting: false         // keep ttf hint info (fpgm, prep, cvt). default = true
    }))
    .dest('build/nantong');

fontmin.run(function (err, files) {
    if (err) {
        throw err;
    }

    console.log(files[0]);
    // => { contents: <Buffer 00 01 00 ...> }
});
