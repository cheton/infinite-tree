var fs = require('fs');

var data = [];
var source = '{"id":"<root>","name":"<root>","props":{"droppable":true},"children":[{"id":"alpha","name":"Alpha","props":{"droppable":true}},{"id":"bravo","name":"Bravo","props":{"droppable":true},"children":[{"id":"charlie","name":"Charlie","props":{"droppable":true},"children":[{"id":"delta","name":"Delta","props":{"droppable":true},"children":[{"id":"echo","name":"Echo","props":{"droppable":true}},{"id":"foxtrot","name":"Foxtrot","props":{"droppable":true}}]},{"id":"golf","name":"Golf","props":{"droppable":true}}]},{"id":"hotel","name":"Hotel","props":{"droppable":true},"children":[{"id":"india","name":"India","props":{"droppable":true},"children":[{"id":"juliet","name":"Juliet","props":{"droppable":true}}]}]},{"id":"kilo","name":"(Load On Demand) Kilo","loadOnDemand":true,"props":{"droppable":true}}]}]}';

for (var i = 0; i < 500; ++i) {
    data.push(JSON.parse(source.replace(/"(id|name)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

fs.writeFileSync('./data.json', JSON.stringify(data), 'utf8');
