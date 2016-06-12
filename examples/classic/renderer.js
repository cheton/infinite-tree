import classNames from 'classnames';
import { buildHTML } from '../../src/helper';

const renderer = (node, treeOptions) => {
    const { id, name, loadOnDemand = false, children, state, props = {} } = node;
    const droppable = (treeOptions.droppable) && (props.droppable);
    const { depth, open, path, total, loading = false, selected = false } = state;
    const childrenLength = Object.keys(children).length;
    const more = node.hasChildren();

    let togglerContent = '';
    if (!more && loadOnDemand) {
        togglerContent = buildHTML('i', '', {
            'class': classNames('glyphicon', 'glyphicon-triangle-right')
        });
    }
    if (more && open) {
        togglerContent = buildHTML('i', '', {
            'class': classNames('glyphicon', 'glyphicon-triangle-bottom')
        });
    }
    if (more && !open) {
        togglerContent = buildHTML('i', '', {
            'class': classNames('glyphicon', 'glyphicon-triangle-right')
        });
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

    const icon = buildHTML('i', '', {
        'class': classNames(
            'infinite-tree-folder-icon',
            'glyphicon',
            { 'glyphicon-folder-open': more && open },
            { 'glyphicon-folder-close': more && !open },
            { 'glyphicon-file': !more }
        )
    });
    const title = buildHTML('span', escapeHTML(name), {
        'class': classNames('infinite-tree-title')
    });
    const loadingIcon = buildHTML('i', '', {
        'style': 'margin-left: 5px',
        'class': classNames(
            { 'hidden': !loading },
            'glyphicon',
            'glyphicon-refresh',
            { 'rotating': loading }
        )
    });
    const count = buildHTML('span', childrenLength, {
        'class': 'count'
    });
    const treeNode = buildHTML('div', toggler + icon + title + loadingIcon + count, {
        'class': 'infinite-tree-node',
        'style': 'margin-left: ' + depth * 18 + 'px'
    });

    let treeNodeAttributes = {
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
    };
    if (droppable) {
        treeNodeAttributes['droppable'] = true;
    }

    return buildHTML('div', treeNode, treeNodeAttributes);
};

export default renderer;
