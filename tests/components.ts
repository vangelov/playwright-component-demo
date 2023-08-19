import { Locator, Page, expect } from "@playwright/test";

export function locateHeader(page: Page) {
  const self = page.locator('header');

  const input = self.getByPlaceholder('What needs to be done?');
  const toggleAllButton = page.getByLabel('Mark all as complete');

  const completeAll = () => toggleAllButton.check();
  const uncompleteAll = () => toggleAllButton.uncheck();
   
  const addTodo = async (text: string) => {
    await input.fill(text);
    await input.press('Enter');
  }; 

  return {
    addTodo,
    completeAll,
    uncompleteAll,
    expect: () => ({
      ...expect(self),
      toAllowUncompleteAll: () => expect(toggleAllButton).toBeChecked(),
      notToAllowUncompleteAll: () => expect(toggleAllButton).not.toBeChecked(),
      toHaveEmptyInput: () => expect(input).toBeEmpty()
    })
  };
}

//

export function locateTodosList(page: Page) {
  const self = page.getByRole('list');

  const locateTodos = (options: LocateTodoOptions = {}) => locateTodo(self, options);
  const locateTodoAt = (index: number) => locateTodos({ index });
  const getTodosCount = () => locateTodos().count();

  const forEach = async (f: (todo: Todo) => Promise<void>) => {
    const todosCount = await getTodosCount();
    for (let i = 0; i < todosCount; i++) 
      await f(locateTodoAt(i));
  }

  return { 
    locateTodoAt,
    locateTodos,
    expext: () => ({
      ...expect(self),
      toHaveCompletedNone: () => forEach(todo => todo.expect().toBeCompleted()),
      toHaveCompletedAll: () => forEach(todo => todo.expect().notToBeCompleted()),
    }),
  }; 
}

//

type LocateTodoOptions = { index?: number };
type Todo = ReturnType<typeof locateTodo>;

export function locateTodo(parent: Locator, options: LocateTodoOptions = {}) {
  let self = parent.getByTestId('todo-item');
  if (options.index !== undefined) self = self.nth(options.index);

  const textbox = self.getByRole('textbox', { name: 'Edit' });
  const checkbox = self.getByRole('checkbox');
  const label = self.locator('label');

  const edit = () => self.dblclick();
  const cancelEdit = () => textbox.press('Escape');
  const fill = (text: string) => textbox.fill(text);
  const complete = () => checkbox.check();
  const uncomplete = () => checkbox.uncheck();
  const blur = () => textbox.dispatchEvent('blur');
  const count = () => self.count();

  const save = async (text: string) => {
    await fill(text);
    await textbox.press('Enter');
  };

  return {
    fill,
    blur,
    edit,
    save,
    complete, 
    uncomplete,
    cancelEdit,
    count,
    expect: () => ({
      ...expect(self),
      toBeCompleted: () => expect(self).toHaveClass('completed'),
      notToBeCompleted: () => expect(self).not.toHaveClass('completed'),
      toHaveEditableValue: (value: string) => expect(textbox).toHaveValue(value),
      toBeEditable: async () => {
        await expect(label).toBeHidden();
        await expect(checkbox).toBeHidden();
      }
    }),
  };
}

//

export function locateFooter(page: Page) {
  const self = page.locator('footer');

  const countText = self.getByTestId('todo-count');
  const clearCompletedButton = self.getByRole('button', { name: 'Clear completed' });

  const clearCompleted = () => clearCompletedButton.click();
  const locateLink = (name: string) => locateFooterLink(self, { name });

  return {
    clearCompleted,
    locateLink,
    expect: () => ({
      ...expect(self),
      toHaveCount: (text: string) => expect(countText).toHaveText(text),
      toHaveVisibleCount: () => expect(countText).toBeVisible(),
      toAllowClearingCompleted: (visible: boolean = true) => expect(clearCompletedButton).toBeVisible({ visible }),
    }),
  };
} 

type LocateFooterOptions = {
  name: string;
}

export function locateFooterLink(parent: Locator, { name }: LocateFooterOptions) {
  const self = parent.getByRole('link', { name });

  const select = () => self.click();

  return {
    select,
    expect: () => ({
      ...expect(self),
      toBeSelected: () => expect(self).toHaveClass('selected')
    })
  }
}
