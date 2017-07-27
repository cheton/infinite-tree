/* eslint import/prefer-default-export: 0 */
import classNames from 'classnames';
import escapeHTML from 'escape-html';
import tag from 'html5-tag';

const defaultRowRenderer = (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state } = node;
    const droppable = treeOptions.droppable;
    const { depth, open, path, total, selected = false, filtered } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    if (filtered === false) {
        return '';
    }

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
    const toggler = tag('a', {
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
    }, togglerContent);
    const title = tag('span', {
        'class': classNames('infinite-tree-title')
    }, escapeHTML(name));
    const treeNode = tag('div', {
        'class': 'infinite-tree-node',
        'style': `margin-left: ${depth * 18}px`
    }, toggler + title);

    return tag('div', {
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
    }, treeNode);
};

export {
    defaultRowRenderer
};
