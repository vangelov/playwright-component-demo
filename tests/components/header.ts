import { Page, expect } from "@playwright/test";

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
      toAllowUncompleteAll: (allow = true) => expect(toggleAllButton).toBeChecked({ checked: allow }),
      toHaveEmptyInput: () => expect(input).toBeEmpty()
    })
  };
} 