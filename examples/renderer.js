import { buildHTML, classNames, quoteattr } from '../src/helper';

const rowRenderer = (node) => {
    const { id, label, children, state, props } = node;
    const { droppable = false } = props;
    const { depth, open, path, total, selected = false } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    let toggler = '';
    if (more) {
        let togglerContent = '';
        if (open) {
            togglerContent = buildHTML('i', '', {
                'class': classNames('glyphicon', 'glyphicon-triangle-bottom')
            });
        }
        if (!open) {
            togglerContent = buildHTML('i', '', {
                'class': classNames('glyphicon', 'glyphicon-triangle-right')
            });
        }
        toggler = buildHTML('a', togglerContent, {
            'class': (() => {
                if (more && open) {
                    return classNames('tree-toggler');
                }
                if (more && !open) {
                    return classNames('tree-toggler', 'tree-closed');
                }
                return '';
            })()
        });
    }

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

    let treeNodeAttributes = {
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
    };
    if (droppable) {
        treeNodeAttributes['droppable'] = true;
    }

    return buildHTML('div', treeNode, treeNodeAttributes);
};

export default rowRenderer;
