import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <title>母子每日活动</title>
        <meta name="description" content="我和妈妈的双人日常打卡，一起完成，一起留下记录。" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="母子每日活动" />
        <meta property="og:description" content="我和妈妈的双人日常打卡，一起完成，一起留下记录。" />
        <meta property="og:url" content={`${siteUrl}/`} />
        <meta property="og:image" content={`${siteUrl}/favicon-momdaily.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="母子每日活动" />
        <meta name="twitter:description" content="我和妈妈的双人日常打卡，一起完成，一起留下记录。" />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #F4F3EE;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #171D1A;
  }
}`;

const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://momdaily.smoky-mint-8739.chatgpt.site').replace(/\/+$/, '');
