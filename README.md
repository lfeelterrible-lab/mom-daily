# 日活 · 我和妈妈（MomDaily）

只服务于两个人的共同日常打卡 App：我和妈妈各自完成，双方都完成才计入共同进度。

## 本地运行

```bash
npm install
npx expo start
```

也可以直接运行 `npm run web` 在浏览器里验收。当前 `.env.example` 默认开启 `DEV_DEMO_MODE`，首次进入会看到 26 天连续共同打卡的演示数据；在“我们”页可以切换“我 / 妈妈”，模拟双方打卡、回应、提醒和离线状态。

## Supabase 连接

1. 复制 `.env.example` 为 `.env`，填写 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_ANON_KEY`。
2. 需要真实云端账户时，将 `EXPO_PUBLIC_DEV_DEMO_MODE=false`。
3. 在 Supabase SQL Editor 依次执行 `supabase/schema.sql`、`supabase/policies.sql`，可选执行 `supabase/seed.sql`。
4. Auth 使用匿名会话降低首屏门槛；也提供 `features/auth/auth.ts` 中的邮箱注册、登录、退出方法。

Schema 包含双人 Pair、11 个默认日活、双人独立完成状态、每日汇总、回应、轻提醒、通知设置、头像 Storage bucket、索引、触发器、Realtime publication 和同 Pair RLS。

## 目录

- `app/`：Expo Router 首屏、四个 Tab（今天 / 日历 / 记录 / 我们）
- `components/`：进度环、任务卡、头像、Streak、回应弹层等
- `features/`：Auth、Pairing、Realtime 同步、Streak 计算
- `hooks/`：本地日期跨午夜刷新、云端 bootstrap、Realtime、离线队列
- `store/`：Zustand + AsyncStorage 的乐观更新与待同步队列
- `supabase/`：Schema、RLS Policies、可选 seed

日期统一使用 `getLocalDate()` 的本地年月日，不通过 UTC ISO 字符串推导日期；因此 Asia/Shanghai、Asia/Taipei 等 UTC+8 时区不会把深夜打卡算到第二天。
