import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
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
			browser: true,
			jsnext: true,
			module: true,
		    // pass custom options to the resolve plugin
		    customResolveOptions: {
		      moduleDirectory: 'node_modules'
		    }
		}),
		commonjs(),
		production && uglify() // minify, but only in production
	]
};