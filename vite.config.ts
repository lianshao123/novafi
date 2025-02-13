/*
 * @Author: peng 1063629816@qq.com
 * @Date: 2025-01-20 10:56:07
 * @LastEditors: peng 1063629816@qq.com
 * @LastEditTime: 2025-02-13 18:37:57
 * @FilePath: /novafi-front/novafi/vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: peng 1063629816@qq.com
 * @Date: 2025-01-20 10:56:07
 * @LastEditors: peng 1063629816@qq.com
 * @LastEditTime: 2025-02-13 16:23:20
 * @FilePath: /novafi-front/novafi/vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path';
import config from './vs.config.json';

const isDev = process.env.NODE_ENV === 'dev';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5172,
    strictPort: false,
    host: '0.0.0.0'
  },
  base: isDev ? './' : `${config.aws.HostName}/${config.aws.prefix}/${config.upload.s3Static}`,
})
