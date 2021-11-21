/**
 * Remove a range of items from an array.
 *
 * @function removeItems
 * @param {Array<*>} arr The target array.
 * @param {number} startIndex The index to begin removing from (inclusive).
 * @param {number} removeCount How many items to remove.
 */
const removeArrayItems = (arr, startIndex, removeCount) => {
    const length = arr.length;

    if (startIndex >= length || removeCount <= 0 || startIndex < 0) {
        return;
    }

    removeCount = (startIndex + removeCount > length ? length - startIndex : removeCount);

    const len = length - removeCount;

    for (let i = startIndex; i < len; ++i) {
        arr[i] = arr[i + removeCount];
    }

    arr.length = len;
};

export default removeArrayItems;
