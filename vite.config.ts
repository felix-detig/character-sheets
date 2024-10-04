import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';
// import devtools from 'solid-devtools/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(dirname, 'src');

export default defineConfig({
	server: {
		host: true,
		port: 80,
	},
	build: {
		target: 'esnext',
	},
	define: {
		// API_URI_BASE: '"http://localhost:5000"',
	},
	plugins: [
		/* 
		Uncomment the following line to enable solid-devtools.
		For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
		*/
		// devtools(),
		solidPlugin({
			// babel: {
			// 	plugins: [
			// 		['solid-styled-jsx/babel', { sourceMaps: true }]
			// 	]
			// }
		}),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			includeAssets: [
				'favicon.ico',
				'apple-touch-icon.png',
				'mask-icon.svg',
			],
			manifest: {
				name: 'CukeReview',
				short_name: 'CukeReview',
				start_url: '/',
				background_color: '#141e1c',
				theme_color: '#141e1c',
				description:
					'Track, analyze, and elevate your gaming experience with CukeReview. Seamlessly monitor your gaming journey, log achievements, and keep a record of your victories.',
				display: 'standalone',
				icons: [
					{
						src: 'icons/pwa-64x64.png',
						sizes: '64x64',
						type: 'image/png',
					},
					{
						src: 'icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'icons/maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			assets: path.resolve(srcPath, 'assets'),
			components: path.resolve(srcPath, 'components'),
			store: path.resolve(srcPath, 'store'),
			types: path.resolve(srcPath, 'types'),
			utils: path.resolve(srcPath, 'utils'),
			packages: path.resolve(srcPath, 'packages'),
			integration: path.resolve(srcPath, 'integration'),
			'getter-graph': path.resolve(srcPath, './packages/getter-graph'),
			'user-functions': path.resolve(srcPath, './packages/user-functions'),
			'sheet': path.resolve(srcPath, './packages/sheet'),
		},
	},
});
