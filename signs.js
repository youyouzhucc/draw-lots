/**
 * 职场运势签文库
 * 每签包含：等级、标题、正文、建议
 */
const SIGNS = [
  { level: '大吉', title: '贵人相助', text: '今日职场贵人运旺，宜主动沟通、推进重要事项。', advice: '把握上午黄金时段，与上级或关键同事同步进展。' },
  { level: '大吉', title: '灵感迸发', text: '创意与思路格外清晰，适合做方案、写报告、头脑风暴。', advice: '把想法记录下来，下午可能有意外收获。' },
  { level: '吉', title: '稳步推进', text: '工作节奏平稳，适合处理积压任务和细节收尾。', advice: '按计划执行，勿因小事分心。' },
  { level: '吉', title: '合作顺畅', text: '团队协作氛围佳，跨部门沟通容易达成共识。', advice: '主动发起会议或一对一沟通。' },
  { level: '吉', title: '学习成长', text: '今日适合学习新技能、参加培训或向同事请教。', advice: '保持谦虚，记录要点。' },
  { level: '吉', title: '低调蓄力', text: '不宜高调表现，适合默默积累、打磨专业能力。', advice: '少说多做，用结果说话。' },
  { level: '中吉', title: '稳中求进', text: '运势平稳，按部就班即可，不必强求突破。', advice: '完成既定任务，保持节奏。' },
  { level: '中吉', title: '耐心等待', text: '某些事项尚在酝酿，需耐心等待时机成熟。', advice: '做好准备工作，时机一到自然水到渠成。' },
  { level: '中吉', title: '细节制胜', text: '今日细节决定成败，检查文档、数据、流程要格外仔细。', advice: '多复核一遍，避免小疏漏。' },
  { level: '中吉', title: '倾听为上', text: '多听少说，能获得有价值的信息和反馈。', advice: '开会时多记录，会后复盘。' },
  { level: '小吉', title: '平常心', text: '运势一般，保持平常心，做好手头工作即可。', advice: '不宜做重大决策，可推迟到明日。' },
  { level: '小吉', title: '休息调整', text: '若感疲惫，适当休息比硬撑更有利于效率。', advice: '午休或短暂散步，恢复精力。' },
  { level: '小吉', title: '人际润滑', text: '与同事关系融洽，适合化解小摩擦、增进默契。', advice: '一句感谢、一杯咖啡，都能加分。' },
  { level: '平', title: '按部就班', text: '今日无特别起伏，按计划完成工作即可。', advice: '保持节奏，不必焦虑。' },
  { level: '平', title: '静观其变', text: '局势尚不明朗，不宜贸然行动，先观察再决定。', advice: '收集信息，等待更清晰的信号。' },
  { level: '平', title: '稳守为主', text: '守住现有成果比开拓新领域更稳妥。', advice: '巩固既有项目，避免分散精力。' },
  { level: '末吉', title: '谨慎行事', text: '今日宜谨慎，避免冲动承诺或草率表态。', advice: '重要事项多考虑一天再回复。' },
  { level: '末吉', title: '低调避锋芒', text: '不宜争强好胜，低调处理可避免不必要的冲突。', advice: '退一步海阔天空。' },
  { level: '末吉', title: '积蓄能量', text: '运势偏弱，适合学习、整理、规划，为后续蓄力。', advice: '今日的积累，是明日的资本。' },
  { level: '凶', title: '诸事不宜', text: '今日宜静不宜动，避免重要决策和对外承诺。', advice: '以守为主，明日再战。' },
];

/** 星座列表（按生日月份划分） */
const ZODIAC_SIGNS = [
  { name: '摩羯座', start: [12, 22], end: [1, 19] },
  { name: '水瓶座', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', start: [2, 19], end: [3, 20] },
  { name: '白羊座', start: [3, 21], end: [4, 19] },
  { name: '金牛座', start: [4, 20], end: [5, 20] },
  { name: '双子座', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', start: [6, 22], end: [7, 22] },
  { name: '狮子座', start: [7, 23], end: [8, 22] },
  { name: '处女座', start: [8, 23], end: [9, 22] },
  { name: '天秤座', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', start: [10, 24], end: [11, 22] },
  { name: '射手座', start: [11, 23], end: [12, 21] },
];

/** 根据月日获取星座 */
function getZodiacSign(month, day) {
  const date = month * 100 + day;
  for (const sign of ZODIAC_SIGNS) {
    const start = sign.start[0] * 100 + sign.start[1];
    const end = sign.end[0] * 100 + sign.end[1];
    if (sign.start[0] > sign.end[0]) {
      if (date >= start || date <= end) return sign.name;
    } else {
      if (date >= start && date <= end) return sign.name;
    }
  }
  return '摩羯座';
}
