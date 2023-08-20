
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

  // actions of the component hide the internal details of which child or component is used
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
  await component.toHaveCustomCondition();
});
```
 
