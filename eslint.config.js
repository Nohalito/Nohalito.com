/**
 * ESLint flat config.
 *
 * "Flat" is the format that replaced `.eslintrc` in ESLint 9: a plain ES module
 * exporting an array of config objects, applied in order, each optionally scoped
 * by `files`. There is no cascade, no `extends` resolution, and no plugin
 * name-string lookup — a plugin is `import`ed and handed over as an object, so
 * what runs is exactly what is written here.
 *
 * Ordering matters and is the only inheritance mechanism: later objects merge
 * over earlier ones. `js.configs.recommended` therefore comes first, and the
 * project block below it is free to switch individual rules off.
 */
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  /*
    A bare `ignores` object is global rather than per-block. `dist` is build
    output, `Learning` is gitignored scratch work, and ESLint does not read
    .gitignore on its own — so without this, pointing it at the repo root would
    lint files that are deliberately not part of the project.
  */
  { ignores: ['dist', 'Learning', '*.html'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      // Everything under src/ runs in the browser. `window`, `document` and
      // `requestAnimationFrame` are globals here, not undefined variables.
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },

    settings: { react: { version: 'detect' } },

    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },

    rules: {
      ...react.configs.flat.recommended.rules,
      // Vite's JSX transform injects the runtime, so `React` needs no import.
      // Without this the recommended set flags every component in the repo.
      ...react.configs.flat['jsx-runtime'].rules,

      /*
        The rule that matters most here. CLAUDE.md documents a stable-reference
        convention — `BlackHoleAnimation`'s `background` factory,
        `useActiveSection`'s `sectionIds` — where an inline array or arrow tears
        down and rebuilds a WebGL scene on every render. `exhaustive-deps` is
        that convention enforced mechanically instead of remembered.
      */
      ...reactHooks.configs['recommended-latest'].rules,

      // Catches a module exporting non-components alongside components, which
      // silently degrades Fast Refresh into a full page reload.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Runtime prop-types duplicate what the JSDoc blocks already state, and
      // would be superseded by checkJs — see §7 of the repository assessment.
      'react/prop-types': 'off',
    },
  },
]
