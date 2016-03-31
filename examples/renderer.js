import { buildHTML, classNames, quoteattr } from '../src/utils';

const rowRenderer = (node) => {
    const { id, label, children, state } = node;
    const { depth, more, open, path, total, selected = false } = state;
    const childrenLength = Object.keys(children).length;

    let togglerContent = '';
    if (more && open) {
        togglerContent = '<i class="glyphicon glyphicon-chevron-down"></i>';
    }
    if (more && !open) {
        togglerContent = '<i class="glyphicon glyphicon-chevron-right"></i>';
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
            'glyphicon',
            { 'glyphicon-folder-open': more && open },
            { 'glyphicon-folder-close': more && !open },
            { 'glyphicon-file': !more }
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
};

export default rowRenderer;
