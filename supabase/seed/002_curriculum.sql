-- Small, real starter curriculum for Learning OS V2.

insert into public.learning_stages (code, title, description, sort_order)
values ('foundation', '基础交流', '建立日常沟通中最常用的表达基础。', 1)
on conflict (code) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into public.learning_themes (stage_id, code, title, description, sort_order)
select id, 'introductions', '自我介绍', '认识新朋友或同事时，清楚介绍自己。', 1 from public.learning_stages where code = 'foundation'
on conflict (code) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into public.learning_themes (stage_id, code, title, description, sort_order)
select id, 'greetings', '日常问候', '自然地打招呼、回应近况并结束对话。', 2 from public.learning_stages where code = 'foundation'
on conflict (code) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into public.learning_themes (stage_id, code, title, description, sort_order)
select id, 'work-basics', '工作交流', '掌握和同事沟通时的基础表达。', 3 from public.learning_stages where code = 'foundation'
on conflict (code) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into public.lessons (theme_id, slug, title, objective, estimated_minutes, sort_order)
select id, 'introduce-yourself', '自我介绍', '能够介绍姓名、来自哪里以及自己的工作。', 8, 1 from public.learning_themes where code = 'introductions'
on conflict (slug) do update set title = excluded.title, objective = excluded.objective, estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order;

insert into public.lessons (theme_id, slug, title, objective, estimated_minutes, sort_order)
select id, 'meet-a-coworker', '认识新同事', '能够自然地认识新同事并表达欢迎。', 8, 2 from public.learning_themes where code = 'introductions'
on conflict (slug) do update set title = excluded.title, objective = excluded.objective, estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order;

insert into public.lessons (theme_id, slug, title, objective, estimated_minutes, sort_order)
select id, 'everyday-greetings', '日常问候', '能够在日常场景中开始和结束简短对话。', 8, 1 from public.learning_themes where code = 'greetings'
on conflict (slug) do update set title = excluded.title, objective = excluded.objective, estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order;

insert into public.lessons (theme_id, slug, title, objective, estimated_minutes, sort_order)
select id, 'talk-about-work', '聊聊工作', '能够简单说出自己的工作内容和当前任务。', 8, 1 from public.learning_themes where code = 'work-basics'
on conflict (slug) do update set title = excluded.title, objective = excluded.objective, estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order;

insert into public.lesson_items (lesson_id, item_type, content_en, meaning_zh, part_of_speech, level, example_en, example_zh, prompt_zh, answer_en, sort_order)
select l.id, x.item_type, x.content_en, x.meaning_zh, x.part_of_speech, x.level, x.example_en, x.example_zh, x.prompt_zh, x.answer_en, x.sort_order
from public.lessons l
join (values
  ('introduce-yourself','word','name','名字','noun','A1','My name is Tom.','我叫 Tom。',null,null,1),
  ('introduce-yourself','word','from','来自','preposition','A1','I am from Shanghai.','我来自上海。',null,null,2),
  ('introduce-yourself','phrase','work as','从事……工作','phrase','A1','I work as a designer.','我是一名设计师。',null,null,3),
  ('introduce-yourself','phrase','nice to meet you','很高兴认识你','phrase','A1','Nice to meet you, Anna.','很高兴认识你，Anna。',null,null,4),
  ('introduce-yourself','scenario','','',null,'A1','Hello, I am Tom. I work as a designer.','你好，我叫 Tom。我是一名设计师。','你好，我叫 Tom。我是一名设计师。','Hello, I am Tom. I work as a designer.',5),
  ('meet-a-coworker','word','welcome','欢迎','verb','A1','Welcome to the team.','欢迎加入团队。',null,null,1),
  ('meet-a-coworker','phrase','let me introduce','让我介绍一下','phrase','A1','Let me introduce my colleague.','让我介绍一下我的同事。',null,null,2),
  ('meet-a-coworker','phrase','looking forward to','期待','phrase','B1','I am looking forward to working with you.','我期待和你一起工作。',null,null,3),
  ('meet-a-coworker','sentence','How is your first week going?','你第一周过得怎么样？','sentence','A2','How is your first week going?','你第一周过得怎么样？',null,null,4),
  ('meet-a-coworker','scenario','','',null,'A1','Welcome to the team. Let me introduce myself.','欢迎加入团队。我来介绍一下自己。','选择正确表达：欢迎新同事加入团队。','Welcome to the team.',5),
  ('everyday-greetings','word','hello','你好','interjection','A1','Hello, how are you today?','你好，你今天怎么样？',null,null,1),
  ('everyday-greetings','phrase','good morning','早上好','phrase','A1','Good morning, everyone.','大家早上好。',null,null,2),
  ('everyday-greetings','phrase','see you later','回头见','phrase','A1','See you later at the office.','办公室见。',null,null,3),
  ('everyday-greetings','sentence','How are you?','你好吗？','sentence','A1','How are you? I am good, thanks.','你好吗？我很好，谢谢。',null,null,4),
  ('everyday-greetings','scenario','','',null,'A1','Good morning. How are you?','早上好。你好吗？','选择正确表达：早上遇到同事。','Good morning. How are you?',5),
  ('talk-about-work','word','project','项目','noun','A2','This project is important.','这个项目很重要。',null,null,1),
  ('talk-about-work','phrase','work on','从事，处理','phrase','A2','I am working on a new report.','我正在处理一份新报告。',null,null,2),
  ('talk-about-work','phrase','make progress','取得进展','phrase','B1','We are making good progress.','我们进展顺利。',null,null,3),
  ('talk-about-work','sentence','I am responsible for...','我负责……','sentence','B1','I am responsible for customer research.','我负责客户研究。',null,null,4),
  ('talk-about-work','scenario','', '',null,'A2','I am working on a new project this week.','这周我正在做一个新项目。','选择正确表达：说明本周正在做新项目。','I am working on a new project this week.',5)
) as x(lesson_slug,item_type,content_en,meaning_zh,part_of_speech,level,example_en,example_zh,prompt_zh,answer_en,sort_order) on x.lesson_slug = l.slug
on conflict (lesson_id, sort_order) do update set item_type = excluded.item_type, content_en = excluded.content_en, meaning_zh = excluded.meaning_zh, part_of_speech = excluded.part_of_speech, level = excluded.level, example_en = excluded.example_en, example_zh = excluded.example_zh, prompt_zh = excluded.prompt_zh, answer_en = excluded.answer_en;

update public.lesson_items item
set system_dictionary_id = dictionary.id
from public.system_dictionary dictionary
where item.item_type = 'word'
  and dictionary.normalized_term = lower(trim(item.content_en));
