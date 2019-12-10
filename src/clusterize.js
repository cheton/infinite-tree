import { EventEmitter } from 'events';
import ensureArray from './ensure-array';
import { getIEVersion } from './browser';
import {
    getElementStyle,
    addEventListener,
    removeEventListener
} from './dom';

const ie = getIEVersion();

class Clusterize extends EventEmitter {
    options = {
        rowsInBlock: 50,
        blocksInCluster: 4,
        tag: null,
        emptyClass: '',
        emptyText: '',
        keepParity: true
    };

    state = {
        lastClusterIndex: -1,
        itemHeight: 0,
        blockHeight: 0,
        clusterHeight: 0
    };

    scrollElement = null;

    contentElement = null;

    rows = [];

    cache = {};

    scrollEventListener = (() => {
        let debounce = null;

        return () => {
            const isMac = navigator.platform.toLowerCase().indexOf('mac') >= 0;
            if (isMac) {
                if (this.contentElement.style.pointerEvents !== 'none') {
                    this.contentElement.style.pointerEvents = 'none';
                }

                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                }

                debounce = setTimeout(() => {
                    debounce = null;
                    this.contentElement.style.pointerEvents = 'auto';
                }, 50);
            }

            const clusterIndex = this.getCurrentClusterIndex();
            if (this.state.lastClusterIndex !== clusterIndex) {
                this.changeDOM();
            }
            this.state.lastClusterIndex = clusterIndex;
        };
    })();

    resizeEventListener = (() => {
        let debounce = null;

        return () => {
            if (debounce) {
                clearTimeout(debounce);
                debounce = null;
            }
            debounce = setTimeout(() => {
                const prevItemHeight = this.state.itemHeight;
                const current = this.computeHeight();

                if ((current.itemHeight > 0) && (prevItemHeight !== current.itemHeight)) {
                    this.state = { ...this.state, ...current };
                    this.update(this.rows);
                }
            }, 100);
        };
    })();

    constructor(options) {
        super();

        if (!(this instanceof Clusterize)) {
            return new Clusterize(options);
        }

        this.options = Object.keys(this.options).reduce((acc, key) => {
            if (options[key] !== undefined) {
                acc[key] = options[key];
            } else {
                acc[key] = this.options[key];
            }
            return acc;
        }, {});

        this.scrollElement = options.scrollElement;
        this.contentElement = options.contentElement;

        // Keep focus on the scrolling content
        if (!this.contentElement.hasAttribute('tabindex')) {
            this.contentElement.setAttribute('tabindex', 0);
        }

        if (Array.isArray(options.rows)) {
            this.rows = options.rows;
        } else {
            this.rows = [];

            const nodes = this.contentElement.children;
            const length = nodes.length;
            for (let i = 0; i < length; ++i) {
                const node = nodes[i];
                this.rows.push(node.outerHTML || '');
            }
        }

        // Remember scroll position
        const scrollTop = this.scrollElement.scrollTop;

        this.changeDOM();

        // Restore scroll position
        this.scrollElement.scrollTop = scrollTop;

        addEventListener(this.scrollElement, 'scroll', this.scrollEventListener);
        addEventListener(window, 'resize', this.resizeEventListener);
    }

    destroy(clean) {
        removeEventListener(this.scrollElement, 'scroll', this.scrollEventListener);
        removeEventListener(window, 'resize', this.resizeEventListener);

        const rows = clean ? this.generateEmptyRow() : this.rows();
        this.setContent(rows.join(''));
    }

    update(rows) {
        this.rows = ensureArray(rows);

        // Remember scroll position
        const scrollTop = this.scrollElement.scrollTop;

        if ((this.rows.length * this.state.itemHeight) < scrollTop) {
            this.scrollElement.scrollTop = 0;
            this.state.lastClusterIndex = 0;
        }
        this.changeDOM();

        // Restore scroll position
        this.scrollElement.scrollTop = scrollTop;
    }

    clear() {
        this.rows = [];
        this.update();
    }

    append(rows) {
        rows = ensureArray(rows);
        if (!rows.length) {
            return;
        }
        this.rows = this.rows.concat(rows);
        this.changeDOM();
    }

    prepend(rows) {
        rows = ensureArray(rows);
        if (!rows.length) {
            return;
        }
        this.rows = rows.concat(this.rows);
        this.changeDOM();
    }

    computeHeight() {
        if (!this.rows.length) {
            return {
                clusterHeight: 0,
                blockHeight: this.state.blockHeight,
                itemHeight: this.state.itemHeight
            };
        } else {
            const nodes = this.contentElement.children;
            const node = nodes[Math.floor(nodes.length / 2)];

            let itemHeight = node.offsetHeight;

            if (this.options.tag === 'tr' && getElementStyle(this.contentElement, 'borderCollapse') !== 'collapse') {
                itemHeight += parseInt(getElementStyle(this.contentElement, 'borderSpacing'), 10) || 0;
            }

            if (this.options.tag !== 'tr') {
                const marginTop = parseInt(getElementStyle(node, 'marginTop'), 10) || 0;
                const marginBottom = parseInt(getElementStyle(node, 'marginBottom'), 10) || 0;
                itemHeight += Math.max(marginTop, marginBottom);
            }

            const blockHeight = itemHeight * this.options.rowsInBlock;
            const clusterHeight = blockHeight * this.options.blocksInCluster;

            return {
                itemHeight,
                blockHeight,
                clusterHeight
            };
        }
    }

    getCurrentClusterIndex() {
        const { blockHeight, clusterHeight } = this.state;
        if (!blockHeight || !clusterHeight) {
            return 0;
        }
        return Math.floor(this.scrollElement.scrollTop / (clusterHeight - blockHeight)) || 0;
    }

    generateEmptyRow() {
        const { tag, emptyText, emptyClass } = this.options;

        if (!tag || !emptyText) {
            return [];
        }

        const emptyRow = document.createElement(tag);
        emptyRow.className = emptyClass;

        if (tag === 'tr') {
            const td = document.createElement('td');
            td.colSpan = 100;
            td.appendChild(document.createTextNode(emptyText));
            emptyRow.appendChild(td);
        } else {
            emptyRow.appendChild(document.createTextNode(emptyText));
        }

        return [emptyRow.outerHTML];
    }

    renderExtraTag(className, height) {
        const tag = document.createElement(this.options.tag);
        const prefix = 'infinite-tree-';

        tag.className = [
            prefix + 'extra-row',
            prefix + className
        ].join(' ');

        if (height) {
            tag.style.height = height + 'px';
        }

        return tag.outerHTML;
    }

    changeDOM() {
        if (!this.state.clusterHeight && this.rows.length > 0) {
            if (ie && ie <= 9 && !this.options.tag) {
                this.options.tag = this.rows[0].match(/<([^>\s/]*)/)[1].toLowerCase();
            }

            if (this.contentElement.children.length <= 1) {
                this.cache.content = this.setContent(this.rows[0] + this.rows[0] + this.rows[0]);
            }

            if (!this.options.tag) {
                this.options.tag = this.contentElement.children[0].tagName.toLowerCase();
            }

            this.state = { ...this.state, ...this.computeHeight() };
        }

        let topOffset = 0;
        let bottomOffset = 0;
        let rows = [];

        if (this.rows.length < this.options.rowsInBlock) {
            rows = (this.rows.length > 0) ? this.rows : this.generateEmptyRow();
        } else {
            const rowsInCluster = this.options.rowsInBlock * this.options.blocksInCluster;
            const clusterIndex = this.getCurrentClusterIndex();
            const visibleStart = Math.max((rowsInCluster - this.options.rowsInBlock) * clusterIndex, 0);
            const visibleEnd = visibleStart + rowsInCluster;

            topOffset = Math.max(visibleStart * this.state.itemHeight, 0);
            bottomOffset = Math.max((this.rows.length - visibleEnd) * this.state.itemHeight, 0);

            // Returns a shallow copy of the rows selected from `visibleStart` to `visibleEnd` (`visibleEnd` not included).
            rows = this.rows.slice(visibleStart, visibleEnd);
        }

        const content = rows.join('');
        const contentChanged = this.checkChanges('content', content);
        const topOffsetChanged = this.checkChanges('top', topOffset);
        const bottomOffsetChanged = this.checkChanges('bottom', bottomOffset);

        if (contentChanged || topOffsetChanged) {
            const layout = [];

            if (topOffset > 0) {
                if (this.options.keepParity) {
                    layout.push(this.renderExtraTag('keep-parity'));
                }
                layout.push(this.renderExtraTag('top-space', topOffset));
            }

            layout.push(content);

            if (bottomOffset > 0) {
                layout.push(this.renderExtraTag('bottom-space', bottomOffset));
            }

            this.emit('clusterWillChange');

            this.setContent(layout.join(''));

            this.emit('clusterDidChange');
        } else if (bottomOffsetChanged) {
            this.contentElement.lastChild.style.height = bottomOffset + 'px';
        }
    }

    setContent(content) {
        // For IE 9 and older versions
        if (ie && ie <= 9 && this.options.tag === 'tr') {
            const div = document.createElement('div');
            div.innerHTML = `<table><tbody>${content}</tbody></table>`;

            let lastChild = this.contentElement.lastChild;
            while (lastChild) {
                this.contentElement.removeChild(lastChild);
                lastChild = this.contentElement.lastChild;
            }

            const rowsNodes = this.getChildNodes(div.firstChild.firstChild);
            while (rowsNodes.length) {
                this.contentElement.appendChild(rowsNodes.shift());
            }
        } else {
            this.contentElement.innerHTML = content;
        }
    }

    getChildNodes(tag) {
        const childNodes = tag.children;
        const nodes = [];
        const length = childNodes.length;

        for (let i = 0; i < length; i++) {
            nodes.push(childNodes[i]);
        }

        return nodes;
    }

    checkChanges(type, value) {
        const changed = (value !== this.cache[type]);
        this.cache[type] = value;
        return changed;
    }
}

export default Clusterize;
