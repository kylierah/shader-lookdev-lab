// Reference: https://github.com/vslabs/vite-plugin-glsl
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
});