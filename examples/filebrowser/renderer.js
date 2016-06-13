import classNames from 'classnames';
import escapeHTML from 'escape-html';
import tag from 'html5-tag';

const renderer = (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state, props = {} } = node;
    const { depth, open, path, total, loading = false, selected = false } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    let togglerContent = '';
    if (!more && loadOnDemand) {
        togglerContent = tag('i', {
            'class': classNames('glyphicon', 'glyphicon-triangle-right')
        }, '');
    }
    if (more && open) {
        togglerContent = tag('i', {
            'class': classNames('glyphicon', 'glyphicon-triangle-bottom')
        }, '');
    }
    if (more && !open) {
        togglerContent = tag('i', {
            'class': classNames('glyphicon', 'glyphicon-triangle-right')
        }, '');
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

    const icon = tag('i', {
        'class': classNames(
            'infinite-tree-folder-icon',
            'glyphicon',
            { 'glyphicon-folder-open': more && open },
            { 'glyphicon-folder-close': more && !open },
            { 'glyphicon-file': !more }
        )
    }, '');
    const title = tag('span', {
        'class': classNames('infinite-tree-title')
    }, escapeHTML(name));
    const loadingIcon = tag('i', {
        'style': 'margin-left: 5px',
        'class': classNames(
            { 'hidden': !loading },
            'glyphicon',
            'glyphicon-refresh',
            { 'rotating': loading }
        )
    }, '');

    const columnName = tag('td', {
        'class': 'infinite-tree-node nowrap',
        'style': 'padding-left: ' + depth * 18 + 'px'
    }, toggler + icon + title + loadingIcon);
    const columnSize = tag('td', {
        'class': 'nowrap',
        'style': 'min-width: 50px',
        'width': '1%'
    }, typeof props.size !== undefined ? props.size : '');
    const columnType = tag('td', {
        'class': 'nowrap',
        'style': 'min-width: 50px',
        'width': '1%'
    }, typeof props.type !== undefined ? props.type : '');
    const columnDate = tag('td', {
        'class': 'nowrap',
        'style': 'min-width: 50px',
        'width': '1%'
    }, typeof props.dateModified !== undefined ? props.dateModified : '');

    return tag('tr', {
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
        )
    }, columnName + columnSize + columnType + columnDate);
};

export default renderer;
