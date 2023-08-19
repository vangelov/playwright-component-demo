import { Page, expect, Locator } from "@playwright/test";

type TodoOptions = { index?: number };
type Todo = ReturnType<typeof Todo>;

export function Todo(parent: Locator, options: TodoOptions = {}) {
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

export function TodoList(page: Page) {
  const self = page.getByRole('list');

  const todos = (options: TodoOptions = {}) => Todo(self, options);
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