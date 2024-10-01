// eslint-disable-next-line no-undef
module.exports = {
	env: {
		browser: true,
		es2020: true
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module'
	},
	plugins: ['import', 'solid', '@typescript-eslint'],
	extends: [
		'eslint:recommended',
		// 'plugin:@typescript-eslint/recommended',
		'plugin:solid/recommended'
	],
	rules: {
		'indent': ['error', 'tab', { 'SwitchCase': 1 }],
		'quotes': ['warn', 'single'],
		'import/extensions': ['warn', 'never'],
		'no-implicit-any': 'off',
		// 'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
		'no-unused-vars': 'off',
		'no-dupe-class-members': 'off',
	},
	globals: {
		RequestInit: 'readonly',
		HeadersInit: 'readonly',
	},
}