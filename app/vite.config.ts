import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';
import crypto from 'crypto';
// import devtools from 'solid-devtools/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(dirname, 'src');

export default defineConfig(viteEnv => ({
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
			state: path.resolve(srcPath, 'state'),
			styles: path.resolve(srcPath, 'styles'),
			types: path.resolve(srcPath, 'types'),
			utils: path.resolve(srcPath, 'utils'),
			'getter-graph': path.resolve(srcPath, './packages/getter-graph/index'),
			'user-function': path.resolve(srcPath, './packages/user-function/index'),
			'sheet': path.resolve(srcPath, './packages/sheet/index'),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '@use \'styles/global.scss\' as *;',
			},
		},
		modules: {
			generateScopedName: (className, filePath, css) => {
				const fileName = path.basename(filePath, '.module.scss');
				const hash = crypto.createHash('sha256').update(css).digest('hex').slice(0, 5);

				return `${fileName}__${className}__${hash}`;
			}
		}
	}
}));
