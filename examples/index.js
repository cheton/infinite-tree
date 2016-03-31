import InfiniteTree from '../src';
import { buildHTML, classNames, quoteattr } from '../src/utils';
import '../src/index.styl';

let data = [];
let source = '{"id":"<root>","label":"<root>","children":[{"id":"alpha","label":"Alpha"},{"id":"bravo","label":"Bravo","children":[{"id":"charlie","label":"Charlie","children":[{"id":"delta","label":"Delta","children":[{"id":"echo","label":"Echo"},{"id":"foxtrot","label":"Foxtrot"}]},{"id":"golf","label":"Golf"}]},{"id":"hotel","label":"Hotel","children":[{"id":"india","label":"India","children":[{"id":"juliet","label":"Juliet"}]}]},{"id":"kilo","label":"Kilo"}]}]}';
for (let i = 0; i < 1000; ++i) {
    data.push(JSON.parse(source.replace(/"(id|label)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

const tree = new InfiniteTree({
    autoOpen: true,
    el: document.querySelector('#tree'),
    rowRenderer: (node) => {
        const { id, label, children, state } = node;
        const { depth, more, open, path, total, selected = false } = state;
        const childrenLength = Object.keys(children).length;

        let togglerContent = '';
        if (more && open) {
            togglerContent = '<i class="fa fa-chevron-down"></i>';
        }
        if (more && !open) {
            togglerContent = '<i class="fa fa-chevron-right"></i>';
        }
        const toggler = buildHTML('a', togglerContent, {
            'class': (() => {
                if (more && open) {
                    return classNames(
                        'tree-toggler'
                    );
                }
                if (more && !open) {
                    return classNames(
                        'tree-toggler',
                        'tree-closed'
                    );
                }
                return '';
            })()
        });
        const icon = buildHTML('i', '', {
            'class': classNames(
                'tree-folder-icon',
                'fa',
                'fa-folder'
            )
        });
        const title = buildHTML('span', quoteattr(label), {
            'class': classNames('tree-title')
        });
        const count = buildHTML('span', childrenLength, {
            'class': 'count'
        });
        const treeNode = buildHTML('div', toggler + icon + title + count, {
            'class': 'tree-node',
            'style': 'margin-left: ' + depth * 18 + 'px'
        });
        const treeItem = buildHTML('div', treeNode, {
            'aria-id': id,
            'aria-expanded': more && open,
            'aria-depth': depth,
            'aria-path': path,
            'aria-selected': selected,
            'aria-children': childrenLength,
            'aria-total': total,
            'class': classNames(
                'tree-item',
                { 'tree-selected': selected }
            )
        });

        return treeItem;
    }
});

tree.on('scrollProgress', (progress) => {
    document.querySelector('#scrolling-progress').style = 'width: ' + progress + '%';
});

tree.on('openNode', (node) => {
    console.log('openNode', node);
});
tree.on('closeNode', (node) => {
    console.log('closeNode', node);
});
tree.on('selectNode', (node) => {
    console.log('selectNode', node);
});

tree.loadData(data);

window.tree = tree;
