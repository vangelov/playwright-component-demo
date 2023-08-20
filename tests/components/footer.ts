import { Page, expect, Locator } from "@playwright/test";

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
      toAllowClearCompleted: (visible: boolean = true) => expect(clearCompletedButton).toBeVisible({ visible }),
    }),
  };
} 

//

type FooterLinkOptions = {
  name: string;
};

export function FooterLink(parent: Locator, { name }: FooterLinkOptions) {
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
