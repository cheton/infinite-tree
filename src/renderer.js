import { buildHTML, classNames, quoteattr } from './helper';

const defaultRowRenderer = (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state } = node;
    const { depth, open, path, total, selected = false } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    let togglerContent = '';
    if (more && open) {
        togglerContent = '▼';
    }
    if (more && !open) {
        togglerContent = '►';
    }
    if (!more && loadOnDemand) {
        togglerContent = '►';
    }
    const toggler = buildHTML('a', togglerContent, {
        'class': (() => {
            if (more && open) {
                return classNames('infinite-tree-toggler');
            }
            if (more && !open) {
                return classNames('infinite-tree-toggler', 'infinite-tree-closed');
            }
            if (!more && loadOnDemand) {
                return classNames('infinite-tree-toggler', 'infinite-tree-closed');
            }
            return '';
        })()
    });
    const title = buildHTML('span', quoteattr(name), {
        'class': classNames('infinite-tree-title')
    });
    const treeNode = buildHTML('div', toggler + title, {
        'class': 'infinite-tree-node',
        'style': 'margin-left: ' + depth * 18 + 'px'
    });

    return buildHTML('div', treeNode, {
        'aria-id': id,
        'aria-expanded': more && open,
        'aria-depth': depth,
        'aria-path': path,
        'aria-selected': selected,
        'aria-children': childrenLength,
        'aria-total': total,
        'class': classNames(
            'infinite-tree-item',
            { 'infinite-tree-selected': selected }
        ),
        'droppable': true
    });
};

export {
    defaultRowRenderer
};
