import { test } from 'tap';
import removeArrayItems from '../src/remove-array-items';

test('should return if the start index is greater than or equal to the length of the array', (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, arr.length + 1, 5);
    t.equals(arr.length, 10);
    t.end();
})

test('should return if the remove count is 0', (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, 2, 0);
    t.equals(arr.length, 10);
    t.end();
});

test('should remove the number of elements specified from the array, starting from the start index', (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, 3, 4);
    t.deepEquals(arr, [1, 2, 3, 8, 9, 10]);
    t.end();
});

test('should remove other elements if delete count is larger than the number of elements after start index', (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, 7, 10);
    t.deepEquals(arr, [1, 2, 3, 4, 5, 6, 7]);
    t.end();
});

test('should remove no element if count is less than or equal to zero', function (t) {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, 7, -2);
    t.deepEquals(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    t.end();
});

test('should remove no element if start is less than or equal to zero', (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, -7, 5);
    t.deepEquals(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    t.end();
});

test("should remove the remaining elements start with 'start' if count is greater than arr.length", (t) => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    removeArrayItems(arr, 4, 100);
    t.deepEquals(arr, [1, 2, 3, 4]);
    t.end();
});
