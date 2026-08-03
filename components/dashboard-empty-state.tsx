type DashboardEmptyStateProps = {
  currentLevel: string;
  targetLevel: string;
  learningPhase: string;
};

export function DashboardEmptyState({
  currentLevel,
  targetLevel,
  learningPhase
}: DashboardEmptyStateProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">English Journey</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink-950">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Phase 1 已建立工作台入口。学习数据会在后续阶段接入词库、训练、复习和弱点记录后显示。
            </p>
          </div>
          <div className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-600">
            Current Phase: <span className="font-medium text-ink-950">{learningPhase}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard label="Current Level" value={currentLevel} />
        <StatusCard label="Target" value={targetLevel} />
        <StatusCard label="Progress" value="0%" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-950">Today&apos;s Plan</h2>
            <span className="rounded-md bg-panel px-2 py-1 text-xs text-ink-600">
              Empty
            </span>
          </div>
          <div className="mt-5 rounded-md border border-dashed border-line bg-panel p-4 text-sm leading-6 text-ink-600">
            今日任务将在 Phase 3-5 接入训练、Review 和 Weakness 数据后生成。
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-ink-950">Current Weakness</h2>
          <div className="mt-5 rounded-md border border-dashed border-line bg-panel p-4 text-sm leading-6 text-ink-600">
            暂无弱点记录。完成训练后，系统会在这里展示需要复习和强化的内容。
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-ink-950">Continue Learning</h2>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          最近学习内容会在后续阶段接入。当前页面用于验证登录、用户创建和基础工作台布局。
        </p>
      </section>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-950">{value}</p>
    </div>
  );
}
