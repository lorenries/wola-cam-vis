import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import legacy from 'rollup-plugin-legacy';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default [
	{
		input: "src/scripts/index.js",
		output: {
			format: "umd",
			name: "d3",
			file: "src/lib/d3.rollup.js",
			globals: {
				d3: 'd3'
			}
		},
		plugins: [
			babel({
			      exclude: 'node_modules/**' // only transpile our source code
			  }),
			resolve({
				jsnext: true,
				module: true
			}),
			uglify() // minify
		]
	},
	{
		input: 'src/scripts/main.js',
		output: {
			file: 'src/main.min.js',
			format: 'iife', // immediately-invoked function expression — suitable for <script> tags
			sourcemap: true
		},
		plugins: [
			babel({
			      exclude: 'node_modules/**' // only transpile our source code
			  }),
			resolve({
				jsnext: true
				}),
			legacy({
				'node_modules/d3-tip/index.js': 'd3.tip'
			}),
			commonjs(),
			production && uglify() // minify, but only in production
		],
		context: 'window',
		external: ['d3']
	}
];