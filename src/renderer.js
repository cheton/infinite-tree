import { buildHTML, classNames, quoteattr } from './utils';

const defaultRowRenderer = (node) => {
    const { id, label, state } = node;
    const { depth, more, open, path, children, total, selected = false } = state;

    let togglerContent = '';
    if (more && open) {
        togglerContent = '▼';
    }
    if (more && !open) {
        togglerContent = '►';
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
    const title = buildHTML('span', quoteattr(label), {
        'class': classNames('tree-title')
    });
    const treeNode = buildHTML('div', toggler + title, {
        'class': 'tree-node',
        'style': 'margin-left: ' + depth * 12 + 'px'
    });
    const treeItem = buildHTML('div', treeNode, {
        'aria-id': id,
        'aria-expanded': more && open,
        'aria-depth': depth,
        'aria-path': path,
        'aria-selected': selected,
        'aria-children': children ? Object.keys(children).length : 0,
        'aria-total': total,
        'class': classNames(
            'tree-item',
            { 'tree-selected': selected }
        )
    });

    return treeItem;
};

export {
    defaultRowRenderer
};
