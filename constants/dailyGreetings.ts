export type SystemDailyGreeting = {
  title: string;
  content: string;
  signature: string;
};

/** A small, date-stable library of system-written notes for the Today screen. */
const dailyGreetings: SystemDailyGreeting[] = [
  { title: '把今天过好', content: '不必急着赶路，把饭吃好，把话说完，就是很好的今天。', signature: '日活写给你们' },
  { title: '小事会发光', content: '早饭、问候和晚安，看似平常，却是陪伴留下来的光。', signature: '日活写给你们' },
  { title: '慢慢来，刚刚好', content: '今天不需要完成得很漂亮，只要你们都在，就已经很珍贵。', signature: '日活写给你们' },
  { title: '留一点时间给彼此', content: '日子很长，愿你们把寻常的一餐一饭，都过得有滋有味。', signature: '日活写给你们' },
  { title: '在同一个今天', content: '即使各自忙着，也可以在一件小事里，轻轻回应彼此。', signature: '日活写给你们' },
  { title: '今天也有好消息', content: '好消息不一定盛大，有人记得你，有人等你，就是其中一件。', signature: '日活写给你们' },
  { title: '日子有了回声', content: '一次打卡是小小的回应，许多次回应，就成了你们共同的日常。', signature: '日活写给你们' },
  { title: '先照顾好自己', content: '把身体安顿好，把心放松一点，剩下的事情我们明天再继续。', signature: '日活写给你们' },
  { title: '平常也值得记下', content: '最值得留下的，往往不是特别的一天，而是这样普通又相伴的一天。', signature: '日活写给你们' },
  { title: '一盏小灯', content: '愿今天的每一件小事，都像灯一样，照亮你们回到彼此身边的路。', signature: '日活写给你们' },
  { title: '见面不必隆重', content: '在同一份清单里碰个面，在一句问候里知道对方平安，就很好。', signature: '日活写给你们' },
  { title: '把心放在今天', content: '昨天已经走远，明天还没到来，今天的这份陪伴正好在手边。', signature: '日活写给你们' },
  { title: '给日子留个标记', content: '每一次共同完成，都是时间替你们保留下来的温柔证据。', signature: '日活写给你们' },
  { title: '有回应，就有陪伴', content: '不用说很多，一句“我在”，就能让平常的一天变得安心。', signature: '日活写给你们' },
  { title: '今天的风很轻', content: '愿你们不慌不忙，吃喜欢的饭，说想说的话，睡一个好觉。', signature: '日活写给你们' },
  { title: '一起走过小小一天', content: '生活不是一场竞赛，而是两个人把许多普通日子走成一条路。', signature: '日活写给你们' },
  { title: '记得抬头看看', content: '忙碌之外总有一点柔软，今天也别忘了看看身边那个人。', signature: '日活写给你们' },
  { title: '把牵挂放进日常', content: '一顿饭、一通电话、一个晚安，都是牵挂最自然的样子。', signature: '日活写给你们' },
  { title: '今天值得被收藏', content: '不因为它特别，而是因为你们一起走过，所以它有了自己的名字。', signature: '日活写给你们' },
  { title: '给彼此一点耐心', content: '偶尔错过也没有关系，愿你们总能在下一件小事里重新遇见。', signature: '日活写给你们' },
  { title: '平安就是好日子', content: '愿你们今天吃得香、睡得稳，也把一句平安轻轻放进彼此心里。', signature: '日活写给你们' },
  { title: '时间会记得', content: '你们认真过的每一天，都会在很久以后，变成值得回看的光。', signature: '日活写给你们' },
  { title: '不缺席的小约定', content: '每天来这里留下一点痕迹，让陪伴不只存在于想念里。', signature: '日活写给你们' },
  { title: '今天也互相照看', content: '照顾好自己，也记得问一句对方：今天过得还好吗？', signature: '日活写给你们' },
  { title: '一切慢慢变好', content: '不用一次走很远，和重要的人一起，向前一点点就足够。', signature: '日活写给你们' },
  { title: '日常是最长情的陪伴', content: '愿你们把每个普通早晨和每个安稳夜晚，都过成安心的模样。', signature: '日活写给你们' },
  { title: '给今天一个拥抱', content: '无论今天顺不顺利，都请记得：你们已经一起走过了很多。', signature: '日活写给你们' },
  { title: '小小的坚持', content: '一件事、一句话、一天的相伴，慢慢就是属于你们的节奏。', signature: '日活写给你们' },
  { title: '在日常里相逢', content: '愿你们总能在忙碌的缝隙里，找到一点并肩的时间。', signature: '日活写给你们' },
  { title: '把温柔留到晚上', content: '今天辛苦了，愿晚风替你们收好疲惫，留下一点轻松和安心。', signature: '日活写给你们' },
  { title: '明天也会到来', content: '今天做到这里已经很好，带着这份踏实，安心去休息吧。', signature: '日活写给你们' },
];

export const getSystemDailyGreeting = (date: string): SystemDailyGreeting => {
  const hash = Array.from(date).reduce((total, character) => total + character.charCodeAt(0), 0);
  return dailyGreetings[hash % dailyGreetings.length];
};
