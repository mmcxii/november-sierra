import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noInlineFunctionProps } from "./no-inline-function-props.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-inline-function-props", noInlineFunctionProps, {
  valid: [
    // Pre-extracted handler reference
    {
      code: `
        function Component() {
          const handleClick = () => {};
          return <button onClick={handleClick} />;
        }
      `,
    },
    // Variable reference
    {
      code: `
        function Component() {
          return <button onClick={setCount} />;
        }
      `,
    },
    // ref prop with inline arrow (exempted)
    {
      code: `
        function Component() {
          return <div ref={(el) => { store(el); }} />;
        }
      `,
    },
    // Render prop returning JSX (exempted)
    {
      code: `
        function Component() {
          return <List renderItem={(item) => <div>{item}</div>} />;
        }
      `,
    },
    // Render prop returning JSX fragment (exempted)
    {
      code: `
        function Component() {
          return <List renderItem={(item) => <><span>{item}</span></>} />;
        }
      `,
    },
    // String prop
    {
      code: `
        function Component() {
          return <button type="submit" />;
        }
      `,
    },
    // Boolean prop
    {
      code: `
        function Component() {
          return <button disabled={true} />;
        }
      `,
    },
    // Number prop
    {
      code: `
        function Component() {
          return <input tabIndex={0} />;
        }
      `,
    },
  ],

  invalid: [
    // Basic inline arrow on DOM element
    {
      code: `
function Component() {
  return <button onClick={() => doThing()} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
      output: `
function Component() {
  const handleButtonOnClick = () => doThing();

  return <button onClick={handleButtonOnClick} />;
}
      `.trim(),
    },
    // Custom component inline arrow
    {
      code: `
function Component() {
  return <Input onChange={(e) => setValue(e.target.value)} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
      output: `
function Component() {
  const handleInputOnChange = (e) => setValue(e.target.value);

  return <Input onChange={handleInputOnChange} />;
}
      `.trim(),
    },
    // Custom component with camelCase prop
    {
      code: `
function Component() {
  return <Dialog onOpenChange={(open) => setOpen(open)} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
      output: `
function Component() {
  const handleDialogOnOpenChange = (open) => setOpen(open);

  return <Dialog onOpenChange={handleDialogOnOpenChange} />;
}
      `.trim(),
    },
    // Function expression
    {
      code: `
function Component() {
  return <button onClick={function() { doThing(); }} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
      output: `
function Component() {
  const handleButtonOnClick = function() { doThing(); };

  return <button onClick={handleButtonOnClick} />;
}
      `.trim(),
    },
    // Multi-statement arrow body
    {
      code: `
function Component() {
  return <button onClick={() => { a(); b(); }} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
      output: `
function Component() {
  const handleButtonOnClick = () => { a(); b(); };

  return <button onClick={handleButtonOnClick} />;
}
      `.trim(),
    },
    // Naming conflict: report-only, no fix
    {
      code: `
function Component() {
  const handleButtonOnClick = () => existing();
  return <button onClick={() => doThing()} />;
}
      `.trim(),
      errors: [{ messageId: "noInlineFunctionProps" }],
    },
  ],
});
