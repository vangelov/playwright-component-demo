import { test, type Page } from '@playwright/test';
import { Footer, Header, TodoList } from './components';
 
test.beforeEach(async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
});
 
const TODO_ITEMS = [
  'buy some cheese',
  'feed the cat',
  'book a doctors appointment'
];

test.describe('New Todo', () => {
  test('should allow me to add todo items', async ({ page }) => {
    // Create 1st todo.
    const header = Header(page);
    await header.addTodo(TODO_ITEMS[0]);
    
    const todosList = TodoList(page);

    // Make sure the list only has one todo item.
    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0] 
    ]);

    // Create 2nd todo.
    await header.addTodo(TODO_ITEMS[1]);

    // Make sure the list now has two todo items.
    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0],
      TODO_ITEMS[1]
    ]);

    await checkNumberOfTodosInLocalStorage(page, 2);
  });

  test('should clear text input field when an item is added', async ({ page }) => {
    const header = Header(page);

    // Create one todo item.
    await header.addTodo(TODO_ITEMS[0]);

    // Check that input is empty.  
    await header.expect().toHaveEmptyInput();
    await checkNumberOfTodosInLocalStorage(page, 1);
  });

  test('should append new items to the bottom of the list', async ({ page }) => {
    // Create 3 items.
    await createDefaultTodos(page);
  
    // Check test using different methods.
    const footer = Footer(page);
    await footer.expect().toHaveVisibleCount();
    await footer.expect().toHaveCountText('3 items left');

    // Check all items in one call.
    await TodoList(page).todos().expect().toHaveText(TODO_ITEMS);
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
    await Header(page).completeAll(); 

    // Ensure all todos have 'completed' class.
    await TodoList(page).expect().toHaveAllCompleted();
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);
  });

  test('should allow me to clear the complete state of all items', async ({ page }) => {
    const header = Header(page);
    // Check and then immediately uncheck.
    await header.completeAll();
    await header.uncompleteAll(); 
 
    // Should be no completed classes.
    await TodoList(page).expect().toHaveNoneCompleted();
  });

  test('complete all checkbox should update state when items are completed / cleared', async ({ page }) => {
    const header = Header(page);
    await header.completeAll();
    await header.expect().toAllowUncompleteAll();
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);

    // Uncheck first todo.
    const firstTodo = TodoList(page).todoAt(0);
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
    const header = Header(page);

    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await header.addTodo(item);
    }

    // Check first item.
    const todosList = TodoList(page);
    const firstTodo = todosList.todoAt(0);
    await firstTodo.complete();
    await firstTodo.expect().toBeCompleted();

    // Check second item. 
    const secondTodo = todosList.todoAt(1);
    await secondTodo.expect().notToBeCompleted();
    await secondTodo.complete();

    // Assert completed class.
    await firstTodo.expect().toBeCompleted();
    await secondTodo.expect().toBeCompleted();
  });

  test('should allow me to un-mark items as complete', async ({ page }) => {
    const header = Header(page);
    const todosList = TodoList(page);

    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await header.addTodo(item);
    }

    const firstTodo = todosList.todoAt(0);
    const secondTodo = todosList.todoAt(1);

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
    const todosList = TodoList(page);

    const secondTodo = todosList.todoAt(1);
    await secondTodo.edit(); 
    await secondTodo.expect().toHaveEditableValue(TODO_ITEMS[1]);
    await secondTodo.save('buy some sausages');

    // Explicitly assert the new text value. 
    await todosList.todos().expect().toHaveText([
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
    const secondTodo = TodoList(page).todoAt(1);
    await secondTodo.edit();
    await secondTodo.expect().toBeEditable();
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  test('should save edits on blur', async ({ page }) => {
    const todosList = TodoList(page);

    const secondTodo = todosList.todoAt(1);
    await secondTodo.edit();
    await secondTodo.fill('buy some sausages');
    await secondTodo.blur();

    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      'buy some sausages',
      TODO_ITEMS[2]
    ]);
    await checkTodosInLocalStorage(page, 'buy some sausages');
  });

  test('should trim entered text', async ({ page }) => {
    const todosList = TodoList(page);

    const secondTodo = todosList.todoAt(1);
    await secondTodo.edit();
    await secondTodo.save('    buy some sausages    ')
   
    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      'buy some sausages',
      TODO_ITEMS[2]
    ]);
    await checkTodosInLocalStorage(page, 'buy some sausages');
  });

  test('should remove the item if an empty text string was entered', async ({ page }) => {
    const todosList = TodoList(page);

    const secondTodo = todosList.todoAt(1);
    await secondTodo.edit();
    await secondTodo.save('');

    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      TODO_ITEMS[2]
    ]);
  });

  test('should cancel edits on escape', async ({ page }) => {
    const todosList = TodoList(page);

    const secondTodo = todosList.todoAt(1);
    await secondTodo.edit();
    await secondTodo.cancelEdit();
    
    await todosList.todos().expect().toHaveText(TODO_ITEMS);
  });
});

test.describe('Counter', () => {
  test('should display the current number of todo items', async ({ page }) => {
    // create a new todo locator
    const header = Header(page);
    const footer = Footer(page);

    await header.addTodo(TODO_ITEMS[0]);
    await footer.expect().toHaveCountText('1 item left');

    await header.addTodo(TODO_ITEMS[1]);
    await footer.expect().toHaveCountText('2 items left');

    await checkNumberOfTodosInLocalStorage(page, 2);
  });
});

test.describe('Clear completed button', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
  });

  test('should display the correct text', async ({ page }) => {
    await TodoList(page).todoAt(0).complete();
    await Footer(page).expect().toAllowClearingCompleted();
  });

  test('should remove completed items when clicked', async ({ page }) => {
    const todosList = TodoList(page);
    await todosList.todoAt(1).complete();
    await Footer(page).clearCompleted();

    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      TODO_ITEMS[2]
    ]);
  });

  test('should be hidden when there are no items that are completed', async ({ page }) => {
    await TodoList(page).todoAt(1).complete();

    const footer = Footer(page);
    await footer.clearCompleted();
    await footer.expect().toAllowClearingCompleted(false);
  });
});

test.describe('Persistence', () => {
  test('should persist its data', async ({ page }) => {
    const header = Header(page);

    for (const item of TODO_ITEMS.slice(0, 2)) {
      await header.addTodo(item);
    } 

    const todosList = TodoList(page);
    const firstTodo = todosList.todoAt(0);
    await firstTodo.complete();
    await firstTodo.expect().toBeCompleted();

    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      TODO_ITEMS[1]
    ]);
    await todosList.todoAt(1).expect().notToBeCompleted();

    // Ensure there is 1 completed item.
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    // Now reload.
    await page.reload();
    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      TODO_ITEMS[1]
    ]);
    await firstTodo.expect().toBeCompleted();
    await todosList.todoAt(1).expect().notToBeCompleted();
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
    const todosList = TodoList(page);
    await todosList.todoAt(1).complete();

    await checkNumberOfCompletedTodosInLocalStorage(page, 1);
    await Footer(page).selectLink('Active');

    await todosList.todos().expect().toHaveText([
      TODO_ITEMS[0], 
      TODO_ITEMS[2]
    ]);
  });

  test('should respect the back button', async ({ page }) => {
    const todosList = TodoList(page);
    const footer = Footer(page);
    await todosList.todoAt(1).complete();

    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await test.step('Showing all items', async () => {
      await footer.selectLink('All');
      await todosList.todos().expect().toHaveCount(3);
    });  

    await test.step('Showing active items', async () => {
      await footer.selectLink('Active');
    });

    await test.step('Showing completed items', async () => {
      await footer.selectLink('Completed');
    });

    await todosList.todos().expect().toHaveCount(1);
    await page.goBack();
    await todosList.todos().expect().toHaveCount(2);
    await page.goBack();
    await todosList.todos().expect().toHaveCount(3);
  });

  test('should allow me to display completed items', async ({ page }) => {
    const todosList = TodoList(page);
    await todosList.todoAt(1).complete();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await Footer(page).selectLink('completed');
    await todosList.todos().expect().toHaveCount(1);
  });

  test('should allow me to display all items', async ({ page }) => {
    const todosList = TodoList(page);
    await todosList.todoAt(1).complete(); 

    const footer = Footer(page);
    await footer.selectLink('Active');
    await footer.selectLink('Completed');
    await footer.selectLink('All');

    await todosList.todos().expect().toHaveCount(3);
  });
 
  test('should highlight the currently applied filter', async ({ page }) => {
    const footer = Footer(page);
    await footer.link('All').expect().toBeSelected();
     
    //create locators for active and completed links
    await footer.selectLink('Active');

    // Page change - active items.
    await footer.link('Active').expect().toBeSelected();
    await footer.selectLink('Completed');

    // Page change - completed items.
    await footer.link('Completed').expect().toBeSelected();
  });
}); 

async function createDefaultTodos(page: Page) {
  // create a new todo locator
  const header = Header(page);

  for (const item of TODO_ITEMS) {
    await header.addTodo(item);
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
