var InfiniteTree = require('../src');

var data = [];
var source = '{"id":"<root>","label":"<root>","children":[{"id":"alpha","label":"Alpha"},{"id":"bravo","label":"Bravo","children":[{"id":"charlie","label":"Charlie","children":[{"id":"delta","label":"Delta","children":[{"id":"echo","label":"Echo"},{"id":"foxtrot","label":"Foxtrot"}]},{"id":"golf","label":"Golf"}]},{"id":"hotel","label":"Hotel","children":[{"id":"india","label":"India","children":[{"id":"juliet","label":"Juliet"}]}]},{"id":"kilo","label":"Kilo"}]}]}';

for (var i = 0; i < 1000; ++i) {
    data.push(JSON.parse(source.replace(/"(id|label)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

var tree = new InfiniteTree({
    autoOpen: true,
    el: document.querySelector('#tree'),

    // Customize your row renderer
    /*
    rowRenderer: (node) => {
        return '<div>' + node.label + '</div>'
    }
    */
});

tree.on('tree.open', (node) => {
    console.log('tree.open', node);
});
tree.on('tree.close', (node) => {
    console.log('tree.close', node);
});
tree.on('tree.select', (node) => {
    console.log('tree.select', node);
});

tree.loadData(data);

window.tree = tree;
