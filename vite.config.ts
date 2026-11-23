import { mdsvex } from 'mdsvex';
import { enhancedImages } from '@sveltejs/enhanced-img';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// mdsvex resolves template paths relative to the project root, and a URL keeps
// the layout independent of the route directory the document is imported from.
const contentLayout = new URL('./src/lib/components/content/ContentLayout.svelte', import.meta.url);

export default defineConfig({
	plugins: [
		mdsvex({
			extensions: ['.svx'],
			templates: { default: contentLayout }
		}),
		enhancedImages(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => {
					const parts = filename.split(/[/\\]/);
					if (parts.includes('node_modules')) return undefined;
					return true;
				}
			},
			adapter: adapter({
				platformProxy: {
					configPath: 'wrangler.jsonc'
				}
			})
		}),
		Icons({
			compiler: 'svelte',
			customCollections: {
				oxy: FileSystemIconLoader('./src/lib/assets/icons')
			}
		})
	],

	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
