import { test, type Page } from '@playwright/test';
import { locateFooter, locateHeader, locateTodosList } from './components';

test.beforeEach(async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
});

const TODO_ITEMS = [
  'buy some cheese',
  'feed the cat',
  'book a doctors appointment'
];

test.describe('New Todo', () => {
  test('should allow me to add todo items', async ({ page, request, context, playwright }) => {
    // Create 1st todo.
    const header = locateHeader(page);
    await header.addTodo(TODO_ITEMS[0]);
    
    const todosList = locateTodosList(page);

    // Make sure the list only has one todo item.
    await todosList.locateTodos().expect().toHaveText([
      TODO_ITEMS[0] 
    ]);

    // Create 2nd todo.
    await header.addTodo(TODO_ITEMS[1]);

    // Make sure the list now has two todo items.
    await todosList.locateTodos().expect().toHaveText([
      TODO_ITEMS[0],
      TODO_ITEMS[1]
    ]);

    await checkNumberOfTodosInLocalStorage(page, 2);
  });

  test('should clear text input field when an item is added', async ({ page }) => {
    const header = locateHeader(page);

    // Create one todo item.
    await header.addTodo(TODO_ITEMS[0]);

    // Check that input is empty.  
    await header.expect().toHaveEmptyInput();
    await checkNumberOfTodosInLocalStorage(page, 1);
  });

  test('should append new items to the bottom of the list', async ({ page }) => {
    // Create 3 items.
    await createDefaultTodos(page);

    // create a todo count locator
    const footer = locateFooter(page);
  
    // Check test using different methods.
    await footer.expect().toHaveVisibleCount();
    await footer.expect().toHaveCount('3 items left');

    // Check all items in one call.
    const todosList = locateTodosList(page);
    await todosList.locateTodos().expect().toHaveText(TODO_ITEMS);
    await checkNumberOfTodosInLocalStorage(page, 3);
  });
});

test.describe('Mark all as completed', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test.afterEach(async ({ page }) => {
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test('should allow me to mark all items as completed', async ({ page }) => {
    // Complete all todos.
    await locateHeader(page).completeAll();

    // Ensure all todos have 'completed' class.
    const todosList = locateTodosList(page); 
    await todosList.expext().toHaveCompletedNone();
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);
  });

  test('should allow me to clear the complete state of all items', async ({ page }) => {
    const header = locateHeader(page);
    // Check and then immediately uncheck.
    await header.completeAll();
    await header.uncompleteAll();

    // Should be no completed classes.
    const todosList = locateTodosList(page); 
    await todosList.expext().toHaveCompletedAll();
  });

  test('complete all checkbox should update state when items are completed / cleared', async ({ page }) => {
    const header = locateHeader(page);
    await header.completeAll();
    await header.expect().toAllowUncompleteAll();
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);

    // Uncheck first todo.
    const firstTodo = locateTodosList(page).locateTodoAt(0);
    await firstTodo.uncomplete();

    // Reuse toggleAll locator and make sure its not checked.
    await header.expect().notToAllowUncompleteAll();

    await firstTodo.complete();
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);

    // Assert the toggle all is checked again.
    await header.expect().toAllowUncompleteAll();
  });
});

test.describe('Item', () => {

  test('should allow me to mark items as complete', async ({ page }) => {
    // create a new todo locator
    const header = locateHeader(page);

    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) 
      await header.addTodo(item);

    // Check first item.
    const todosList = locateTodosList(page);
    const firstTodo = todosList.locateTodoAt(0);
    await firstTodo.complete();
    await firstTodo.expect().toBeCompleted();

    // Check second item. 
    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.expect().notToBeCompleted();
    await secondTodo.complete();

    // Assert completed class.
    await firstTodo.expect().toBeCompleted();
    await secondTodo.expect().toBeCompleted();
  });

  test('should allow me to un-mark items as complete', async ({ page }) => {
    const header = locateHeader(page);
    const todosList = locateTodosList(page);

    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) 
      await header.addTodo(item);

    const firstTodo = todosList.locateTodoAt(0);
    const secondTodo = todosList.locateTodoAt(1);

    await firstTodo.complete();
    await firstTodo.expect().toBeCompleted();
    await secondTodo.expect().notToBeCompleted();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await firstTodo.uncomplete();
    await firstTodo.expect().notToBeCompleted();
    await secondTodo.expect().notToBeCompleted();
    await checkNumberOfCompletedTodosInLocalStorage(page, 0);
  }); 

  test('should allow me to edit an item', async ({ page }) => {
    await createDefaultTodos(page);
    const todosList = locateTodosList(page);

    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.edit(); 
    await secondTodo.expect().toHaveEditableValue(TODO_ITEMS[1]);
    await secondTodo.save('buy some sausages');

    // Explicitly assert the new text value. 
    await todosList.locateTodos().expect().toHaveText([
      TODO_ITEMS[0], 
      'buy some sausages',
      TODO_ITEMS[2]
    ]);

    await checkTodosInLocalStorage(page, 'buy some sausages');
  });
});

test.describe('Editing', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test('should hide other controls when editing', async ({ page }) => {
    const secondTodo = locateTodosList(page).locateTodoAt(1);
    await secondTodo.edit();
    await secondTodo.expect().toBeEditable();
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test('should save edits on blur', async ({ page }) => {
    const todosList = locateTodosList(page);

    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.edit();
    await secondTodo.fill('buy some sausages');
    await secondTodo.blur();

    await todosList.locateTodos().expect().toHaveText([
      TODO_ITEMS[0], 
      'buy some sausages',
      TODO_ITEMS[2]
    ]);
    await checkTodosInLocalStorage(page, 'buy some sausages');
  });

  test('should trim entered text', async ({ page }) => {
    const todosList = locateTodosList(page);

    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.edit();
    await secondTodo.save('    buy some sausages    ')
   
    await todosList.locateTodos().expect().toHaveText([
      TODO_ITEMS[0], 
      'buy some sausages',
      TODO_ITEMS[2]
    ]);
    await checkTodosInLocalStorage(page, 'buy some sausages');
  });

  test('should remove the item if an empty text string was entered', async ({ page }) => {
    const todosList = locateTodosList(page);

    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.edit();
    await secondTodo.save('');

    await todosList.locateTodoAt(0).expect().toHaveText(TODO_ITEMS[0]);
    await todosList.locateTodoAt(1).expect().toHaveText(TODO_ITEMS[2]);
  });

  test('should cancel edits on escape', async ({ page }) => {
    const todosList = locateTodosList(page);

    const secondTodo = todosList.locateTodoAt(1);
    await secondTodo.edit();
    await secondTodo.cancelEdit();
    await todosList.locateTodos().expect().toHaveText(TODO_ITEMS);
  });
});

test.describe('Counter', () => {
  test('should display the current number of todo items', async ({ page }) => {
    // create a new todo locator
    const header = locateHeader(page);
    const footer = locateFooter(page);

    await header.addTodo(TODO_ITEMS[0]);
    await footer.expect().toHaveCount('1 item left');

    await header.addTodo(TODO_ITEMS[1]);
    await footer.expect().toHaveCount('2 items left');

    await checkNumberOfTodosInLocalStorage(page, 2);
  });
});

test.describe('Clear completed button', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
  });

  test('should display the correct text', async ({ page }) => {
    await locateTodosList(page).locateTodoAt(0).complete();
    await locateFooter(page).expect().toAllowClearingCompleted();
  });

  test('should remove completed items when clicked', async ({ page }) => {
    const todosList = locateTodosList(page);
    await todosList.locateTodoAt(1).complete();
    await locateFooter(page).clearCompleted();
    await todosList.locateTodos().expect().toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test('should be hidden when there are no items that are completed', async ({ page }) => {
    const todosList = locateTodosList(page);
    const footer = locateFooter(page);

    await todosList.locateTodoAt(1).complete();
    await footer.clearCompleted();
    await footer.expect().toAllowClearingCompleted(false);
  });
});

test.describe('Persistence', () => {
  test('should persist its data', async ({ page }) => {
    const header = locateHeader(page);

    for (const item of TODO_ITEMS.slice(0, 2)) {
      await header.addTodo(item);
    } 

    const todosList = locateTodosList(page);
    const firstTodo = todosList.locateTodoAt(0);
    await firstTodo.complete();
    await firstTodo.expect().toBeCompleted();

    await todosList.locateTodos().expect().toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await todosList.locateTodoAt(1).expect().notToBeCompleted();

    // Ensure there is 1 completed item.
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    // Now reload.
    await page.reload();
    await todosList.locateTodos().expect().toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await firstTodo.expect().toBeCompleted();
    await todosList.locateTodoAt(1).expect().notToBeCompleted();
  });
});

test.describe('Routing', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    // make sure the app had a chance to save updated todos in storage
    // before navigating to a new view, otherwise the items can get lost :(
    // in some frameworks like Durandal
    await checkTodosInLocalStorage(page, TODO_ITEMS[0]);
  });

  test('should allow me to display active items', async ({ page }) => {
    const todosList = locateTodosList(page);
    await todosList.locateTodoAt(1).complete();

    await checkNumberOfCompletedTodosInLocalStorage(page, 1);
    await locateFooter(page).locateLink('Active').select();
    await todosList.locateTodos().expect().toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test('should respect the back button', async ({ page }) => {
    const todosList = locateTodosList(page);
    const footer = locateFooter(page);
    await todosList.locateTodoAt(1).complete();

    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await test.step('Showing all items', async () => {
      await footer.locateLink('All').select();
      await todosList.locateTodos().expect().toHaveCount(3);
    });  

    await test.step('Showing active items', async () => {
      await footer.locateLink('Active').select();
    });

    await test.step('Showing completed items', async () => {
      await footer.locateLink('Completed').select();
    });

    await todosList.locateTodos().expect().toHaveCount(1);
    await page.goBack();
    await todosList.locateTodos().expect().toHaveCount(2);
    await page.goBack();
    await todosList.locateTodos().expect().toHaveCount(3);
  });

  test('should allow me to display completed items', async ({ page }) => {
    const todosList = locateTodosList(page);
    await todosList.locateTodoAt(1).complete();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    const footer = locateFooter(page);
    await footer.locateLink('Completed').select();
    await todosList.locateTodos().expect().toHaveCount(1);
  });

  test('should allow me to display all items', async ({ page }) => {
    const todosList = locateTodosList(page);
    const footer = locateFooter(page);
    await todosList.locateTodoAt(1).complete(); 
    await footer.locateLink('Active').select();
    await footer.locateLink('Completed').select();
    await footer.locateLink('All').select();
    await todosList.locateTodos().expect().toHaveCount(3);
  });
 
  test('should highlight the currently applied filter', async ({ page }) => {
    const footer = locateFooter(page);
    await footer.locateLink('All').expect().toBeSelected();
     
    //create locators for active and completed links
    await footer.locateLink('Active').select();

    // Page change - active items.
    await footer.locateLink('Active').expect().toBeSelected();
    await footer.locateLink('Completed').select();

    // Page change - completed items.
    await footer.locateLink('Completed').expect().toBeSelected();
  });
}); 

async function createDefaultTodos(page: Page) {
  // create a new todo locator
  const newTodo = page.getByPlaceholder('What needs to be done?');

  for (const item of TODO_ITEMS) {
    await newTodo.fill(item);
    await newTodo.press('Enter');
  }
}

async function checkNumberOfTodosInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['react-todos']).length === e;
  }, expected);
}

async function checkNumberOfCompletedTodosInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['react-todos']).filter((todo: any) => todo.completed).length === e;
  }, expected);
}

async function checkTodosInLocalStorage(page: Page, title: string) {
  return await page.waitForFunction(t => {
    return JSON.parse(localStorage['react-todos']).map((todo: any) => todo.title).includes(t);
  }, title);
}
