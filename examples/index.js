import InfiniteTree from '../src';
import rowRenderer from './renderer';
import '../src/index.styl';

const data = [];
const source = '{"id":"<root>","label":"<root>","children":[{"id":"alpha","label":"Alpha"},{"id":"bravo","label":"Bravo","children":[{"id":"charlie","label":"Charlie","children":[{"id":"delta","label":"Delta","children":[{"id":"echo","label":"Echo"},{"id":"foxtrot","label":"Foxtrot"}]},{"id":"golf","label":"Golf"}]},{"id":"hotel","label":"Hotel","children":[{"id":"india","label":"India","children":[{"id":"juliet","label":"Juliet"}]}]},{"id":"kilo","label":"Kilo"}]}]}';

for (let i = 0; i < 1000; ++i) {
    data.push(JSON.parse(source.replace(/"(id|label)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

const tree = new InfiniteTree({
    autoOpen: true,
    el: document.querySelector('#tree'),
    rowRenderer: rowRenderer
});

const updatePreview = (node) => {
    const el = document.querySelector('#preview');
    if (node) {
        el.innerHTML = JSON.stringify({
            id: node.id,
            label: node.label,
            children: node.children ? node.children.length : 0,
            parent: node.parent ? node.parent.id : null,
            state: node.state
        }, null, 2);
    } else {
        el.innerHTML = '';
    }
};

tree.on('scrollProgress', (progress) => {
    document.querySelector('#scrolling-progress').style = 'width: ' + progress + '%';
});
tree.on('update', () => {
    const node = tree.getSelectedNode();
    updatePreview(node);
});
tree.on('openNode', (node) => {
    console.log('openNode', node);
});
tree.on('closeNode', (node) => {
    console.log('closeNode', node);
});
tree.on('selectNode', (node) => {
    updatePreview(node);
});

tree.loadData(data);

window.tree = tree;
