import classNames from 'classnames';
import { buildHTML, quoteattr } from './helper';

const defaultRowRenderer = (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state } = node;
    const droppable = treeOptions.droppable;
    const { depth, open, path, total, selected = false } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    let togglerContent = '';
    if (!more && loadOnDemand) {
        togglerContent = '►';
    }
    if (more && open) {
        togglerContent = '▼';
    }
    if (more && !open) {
        togglerContent = '►';
    }
    const toggler = buildHTML('a', togglerContent, {
        'class': (() => {
            if (!more && loadOnDemand) {
                return classNames(treeOptions.togglerClass, 'infinite-tree-closed');
            }
            if (more && open) {
                return classNames(treeOptions.togglerClass);
            }
            if (more && !open) {
                return classNames(treeOptions.togglerClass, 'infinite-tree-closed');
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
        'data-id': id,
        'data-expanded': more && open,
        'data-depth': depth,
        'data-path': path,
        'data-selected': selected,
        'data-children': childrenLength,
        'data-total': total,
        'class': classNames(
            'infinite-tree-item',
            { 'infinite-tree-selected': selected }
        ),
        'droppable': droppable
    });
};

export {
    defaultRowRenderer
};
