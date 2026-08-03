import { getContinueLesson } from "@/lib/curriculum";
import { getTodayPlan, type DailyPlanItem } from "@/lib/plans";
import { getWeaknessSummary } from "@/lib/insights";
import { getLearningStats, type LearningStats } from "@/lib/learning";
import { getCurrentUser } from "@/lib/users";

const fallbackTasks: DailyPlanItem[] = [
  { id: "local-lesson", task_type: "lesson", title: "新课学习", description: "学习一节课程中的词汇、短语和例句。", target_minutes: 5, route: "/learning", sort_order: 1, completed: false },
  { id: "local-phrases", task_type: "phrases", title: "高频短语", description: "把今天的表达放进真实句子里。", target_minutes: 5, route: "/practice?mode=usage", sort_order: 2, completed: false },
  { id: "local-review", task_type: "review", title: "Review 复习", description: "巩固最近不稳定的内容。", target_minutes: 5, route: "/review", sort_order: 3, completed: false },
  { id: "local-practice", task_type: "practice", title: "练习巩固", description: "用一次小练习确认今天的掌握情况。", target_minutes: 5, route: "/practice", sort_order: 4, completed: false }
];

const emptyStats: LearningStats = { total: 2000, started: 0, mastered: 0, correct: 0, incorrect: 0, streak: 0 };

export async function getHomeData(userId: string) {
  const [user, plan, lesson, stats, weakness] = await Promise.all([
    getCurrentUser(userId),
    getTodayPlan(userId),
    getContinueLesson(userId),
    getLearningStats(userId),
    getWeaknessSummary(userId)
  ]);
  const currentUser = user;
  const currentPlan = plan.ok ? plan.data : { id: "local-plan", plan_date: new Date().toISOString().slice(0, 10), target_minutes: currentUser?.daily_minutes ?? 20, completed_minutes: 0, items: fallbackTasks };
  const currentLesson = lesson.ok && lesson.data ? lesson.data : { slug: "introduce-yourself", title: "自我介绍", objective: "用英文介绍自己", progress_percent: 0, estimated_minutes: 10 };
  return {
    user: currentUser,
    plan: currentPlan,
    lesson: currentLesson,
    stats: stats.ok ? stats.data : emptyStats,
    weaknesses: weakness.ok ? weakness.data.weaknesses : [],
    openMistakes: weakness.ok ? weakness.data.openMistakes : 0
  };
}
