
# playwright-component-demo
The Playwright demo TodoMVC app tests rewritten using a component-based model

## Introduction

The Page Object Modal is the most recommended approach for better code organisation in your tests. Look at any larger application, however. There's a lot of things that don't change between pages, such as navigation, headers, footers. It's also not just about what stays the same, but also what's reused. 

Let's take tables as an example. Usually apps will have an internal componenent for rendering tables and use it everywhere. So all the logic you might need when writing a test involing a table will 
be the same. In many cases apps will also have components that compose the table component and add specific logic on top of it. For example a Users table with searching or an Invoices tables with sorting.

This ability for reusability and composability makes the component-based model the best way to structure an app. So why not use the same approach when structuring the app's tests?

## Implementation

The basic idea is create an intermediate layer of components that model your app and all of your tests utilise.  The components for the TodoMVC demo app can be found in the  `tests/components` folder.  

Here's a general template of what a component looks like in this context:

```
export function Component (parent, options = {}) {
  const self = parent.locator(...); // The locator for the component's root node
  const child = self.locator(...); // Child element which is too small to be a separate components
  const otherComponent = (options) => OtherComponent(self, options); // child component 

  // Actions of the component hide the internal details of which child or component is used
  const someAction = () => child.click(); 
  const anotherAction = (param) => otherComponent({ param }).action(); 

  // The API that your tests will use:
  return {
    someAction,
    anotherAction,
    expect: () => ({
      ...expect(locator), // Copy all the standard expections from Playwright
      toHaveCustomCondition: () => expect(child).toHaveClass(...) // Custom expectations to hide internal details
   })
 };
}
```

Example usage in a test:

```
test(async ({ page }) => {
  const component = Component(page);
  await component.expect().toBeVisible();
  await component.someAction();
  await component.expect().toHaveCustomCondition();
});
```
## Comparison

Here's a few comparisions between the original and the updated tests:

#### Example 1


```
test('should allow me to mark all items as completed', async ({ page }) => {
    // Complete all todos.
  await page.getByLabel('Mark all as complete').check();

  // Ensure all todos have 'completed' class.
  await expect(page.getByTestId('todo-item')).toHaveClass(['completed', 'completed', 'completed']);
  await checkNumberOfCompletedTodosInLocalStorage(page, 3);
});
```

vs

```
test('should allow me to mark all items as completed', async ({ page }) => {
  // Complete all todos.
  await Header(page).completeAll(); 

  // Ensure all todos have 'completed' class.
  await TodoList(page).expect().toHaveAllCompleted();
  await checkNumberOfCompletedTodosInLocalStorage(page, 3);
});
```

#### Example 2

```
test('should be hidden when there are no items that are completed', async ({ page }) => {
  await page.locator('.todo-list li .toggle').first().check();
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
});
```

vs

```
test('should be hidden when there are no items that are completed', async ({ page }) => {
  await TodoList(page).todoAt(1).complete();
  const footer = Footer(page);
  await footer.clearCompleted();
  await footer.expect().toAllowClearCompleted(false);
});
```

#### Example 3

```
test('should highlight the currently applied filter', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'All' })).toHaveClass('selected');
  await page.getByRole('link', { name: 'Active' }).click();
  // Page change - active items.
  await expect(page.getByRole('link', { name: 'Active' })).toHaveClass('selected');
  await page.getByRole('link', { name: 'Completed' }).click();
  // Page change - completed items.
  await expect(page.getByRole('link', { name: 'Completed' })).toHaveClass('selected');
});
```

vs

```
test('should highlight the currently applied filter', async ({ page }) => {
  const footer = Footer(page);
  await footer.link('All').expect().toBeSelected();
  await footer.selectLink('Active');
  // Page change - active items.
  await footer.link('Active').expect().toBeSelected();
  await footer.selectLink('Completed');
  // Page change - completed items.
  await footer.link('Completed').expect().toBeSelected();
});
```

