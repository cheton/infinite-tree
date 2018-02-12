/* eslint import/prefer-default-export: 0 */
import classNames from 'classnames';
import escapeHTML from 'escape-html';
import tag from 'html5-tag';

export default (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state, props = {} } = node;
    const droppable = treeOptions.droppable;
    const { depth, open, path, total, selected = false, filtered, checked, indeterminate } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    if (filtered === false) {
        return;
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

    const checkbox = tag('input', {
        type: 'checkbox',
        style: 'display: inline-block; margin: 0 4px',
        'class': 'checkbox',
        checked: checked,
        'data-checked': checked,
        'data-indeterminate': indeterminate
    });

    const title = tag('span', {
        'class': classNames('infinite-tree-title')
    }, escapeHTML(loadOnDemand ? '(loadOnDemand) ' + name : name));

    const loadingIcon = tag('i', {
        'style': 'margin-left: 5px',
        'class': classNames(
            { 'hidden': !state.loading },
            'glyphicon',
            'glyphicon-refresh',
            { 'rotating': state.loading }
        )
    }, '');

    const treeNode = tag('div', {
        'class': 'infinite-tree-node',
        'style': `margin-left: ${depth * 18}px`
    }, toggler + checkbox + title + loadingIcon);

    return tag('div', {
        'draggable': 'true',
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
