import { Locator, Page, expect } from "@playwright/test";

export function Header(page: Page) {
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

export function TodoList(page: Page) {
  const self = page.getByRole('list');

  const todos = (options: LocateTodoOptions = {}) => Todo(self, options);
  const todoAt = (index: number) => todos({ index });
  const getTodosCount = () => todos().count();

  const forEach = async (f: (todo: Todo) => Promise<void>) => {
    const todosCount = await getTodosCount();
    
    for (let i = 0; i < todosCount; i++) {
      await f(todoAt(i));
    }
  }

  return { 
    todoAt,
    todos,
    expect: () => ({
      ...expect(self),
      toHaveAllCompleted: () => forEach(todo => todo.expect().toBeCompleted()),
      toHaveNoneCompleted: () => forEach(todo => todo.expect().notToBeCompleted()),
    }),
  }; 
}

//

type LocateTodoOptions = { index?: number };
type Todo = ReturnType<typeof Todo>;

export function Todo(parent: Locator, options: LocateTodoOptions = {}) {
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

export function Footer(page: Page) {
  const self = page.locator('footer');

  const countText = self.getByTestId('todo-count');
  const clearCompletedButton = self.getByRole('button', { name: 'Clear completed' });

  const clearCompleted = () => clearCompletedButton.click();
  const link = (name: string) => FooterLink(self, { name });
  const selectLink = (name: string) => link(name).select();

  return {
    clearCompleted,
    link,
    selectLink,
    expect: () => ({
      ...expect(self),
      toHaveCountText: (text: string) => expect(countText).toHaveText(text),
      toHaveVisibleCount: () => expect(countText).toBeVisible(),
      toAllowClearingCompleted: (visible: boolean = true) => expect(clearCompletedButton).toBeVisible({ visible }),
    }),
  };
} 

type LocateFooterOptions = {
  name: string;
}

export function FooterLink(parent: Locator, { name }: LocateFooterOptions) {
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
