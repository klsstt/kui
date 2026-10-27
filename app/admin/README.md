# KUI 展示站（Admin / Design）
该目录是声明为‘private’ 的非发布应用边界，Admin和Design只是消费公开Library API, 用于文档展示，WCAG门禁和生产构建验收；它只构建为静态沾点部署到服务器。

应用实现Demo/Legacy 模板以及全部私有样式位于本应用的`src/`; 顶层`main.ts`与`design.ts`仅转发本地应用入口，Admin禁止相对访问`package/src`.

- 开发： `npm run dev`
- 构建: `npm run build:demo`
- 预览：`npm run preview`

该应用输出到根目录的`dist-demo/`,不会进入任何npm包。