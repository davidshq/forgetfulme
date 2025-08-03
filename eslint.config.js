import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    files: ["src/**/*.js"],
    ignores: ["src/lib/**/*"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        chrome: "readonly",
        browser: "readonly",
        console: "readonly",
        document: "readonly",
        window: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        EventTarget: "readonly",
        Element: "readonly",
        HTMLElement: "readonly",
        Node: "readonly",
        NodeList: "readonly",
        HTMLCollection: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        location: "readonly",
        history: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        prompt: "readonly",
        confirm: "readonly",
        alert: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "arrow-spacing": "error",
      "no-debugger": "error",
      // JSDoc type checking rules - focused on quality rather than strict coverage
      "valid-jsdoc": ["warn", {
        "requireReturn": false,
        "requireReturnDescription": false,
        "requireParamDescription": true,
        "prefer": {
          "return": "returns"
        },
        "requireReturnType": true,
        "requireParamType": true
      }],
      "require-jsdoc": ["warn", {
        "require": {
          "FunctionDeclaration": false,
          "MethodDefinition": false,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": false,
          "FunctionExpression": false
        }
      }]
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        vitest: "readonly"
      }
    }
  },
  eslintConfigPrettier
];