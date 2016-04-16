var fs = require('fs');

var data = [];
var source = '{"id":"<root>","label":"<root>","props":{"droppable":true},"children":[{"id":"alpha","label":"Alpha","props":{"droppable":true}},{"id":"bravo","label":"Bravo","props":{"droppable":true},"children":[{"id":"charlie","label":"Charlie","props":{"droppable":true},"children":[{"id":"delta","label":"Delta","props":{"droppable":true},"children":[{"id":"echo","label":"Echo","props":{"droppable":true}},{"id":"foxtrot","label":"Foxtrot","props":{"droppable":true}}]},{"id":"golf","label":"Golf","props":{"droppable":true}}]},{"id":"hotel","label":"Hotel","props":{"droppable":true},"children":[{"id":"india","label":"India","props":{"droppable":true},"children":[{"id":"juliet","label":"Juliet","props":{"droppable":true}}]}]},{"id":"kilo","label":"(Load On Demand) Kilo","loadOnDemand":true,"props":{"droppable":true}}]}]}';

for (var i = 0; i < 1000; ++i) {
    data.push(JSON.parse(source.replace(/"(id|label)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

fs.writeFileSync('./data.json', JSON.stringify(data), 'utf8');
