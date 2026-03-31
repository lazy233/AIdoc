BEGIN;

DELETE FROM generation_histories WHERE id IN (
  '90000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000002'
);
DELETE FROM report_projects WHERE id IN (
  '80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002'
);
DELETE FROM report_templates WHERE id IN (
  '70000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002'
);
DELETE FROM ppt_templates WHERE id IN (
  '60000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002'
);
DELETE FROM students WHERE id IN (
  '50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003'
);

INSERT INTO students (
  id, student_no, name, nickname, institution, major, grade, current_semester, report_subtitle,
  service_start_date, advisor_name, report_title, status
) VALUES
  ('50000000-0000-0000-0000-000000000001','S2026001','林知夏','Celia','上海民办中学','国际课程','高二','2026春季','阶段学习总结','2025-09-01','王老师','林知夏 2026 春季结业报告','draft'),
  ('50000000-0000-0000-0000-000000000002','S2026002','周柏言','Evan','苏州外国语学校','AP课程','高一','2026春季','学期能力回顾','2025-10-15','陈老师','周柏言 2026 春季结业报告','completed'),
  ('50000000-0000-0000-0000-000000000003','S2026003','顾清禾','Mia','杭州国际高中','A-Level','高三','2026春季','升学规划报告','2025-08-20','李老师','顾清禾 学业规划报告','draft');

INSERT INTO student_learning_profiles (
  student_id, strength_subjects, international_score, study_intent, career_intent,
  interest_subjects, long_term_plan, learning_style, weakness
) VALUES
  ('50000000-0000-0000-0000-000000000001','数学、物理','IELTS 6.5','申请工科本科','数据分析师','Python、机器人、数学建模','先申请香港和新加坡院校，再考虑研究型方向','擅长结构化学习，适合任务拆解式推进','英文长篇写作较弱，课堂复盘不够及时'),
  ('50000000-0000-0000-0000-000000000002','经济、统计','TOEFL 98','申请商科本科','金融分析师','经济学、商业案例、演讲','提升商业分析能力，逐步建立竞赛和活动背景','反应快，适合案例讨论和图表分析','作业细节检查不足，时间管理需要加强'),
  ('50000000-0000-0000-0000-000000000003','化学、生物','IELTS 7.0','申请生物医学相关专业','科研或医学相关职业','生物实验、阅读、志愿活动','聚焦英国和澳洲方向，准备申请材料与文书','习惯用思维导图归纳，适合阶段性里程碑推进','口语表达信心不足，需要更多面试模拟');

INSERT INTO student_lesson_data (
  student_id, total_hours, used_hours, remaining_hours, tutoring_subjects, preview_subjects, skill_focus, skill_description
) VALUES
  ('50000000-0000-0000-0000-000000000001',120,86,34,'数学、物理、学术写作','微积分、力学基础','逻辑表达与学术写作','本学期重点强化题目拆解、图表解释和英文写作框架'),
  ('50000000-0000-0000-0000-000000000002',96,72,24,'经济、统计、英语','宏观经济、数据建模','案例分析与时间管理','当前阶段重点在于提升图表分析表达与作业完成质量'),
  ('50000000-0000-0000-0000-000000000003',140,104,36,'化学、生物、英语口语','生物实验设计、医学阅读','申请规划与口语表达','需要把申请时间线与语言准备同步推进，保证材料完整度');

INSERT INTO student_ai_copies (
  student_id, term_overview, course_feedback, short_term_advice, long_term_roadmap
) VALUES
  ('50000000-0000-0000-0000-000000000001','本学期整体表现稳定，数理科基础扎实，能够较快吸收课堂重点。','在难题拆解和课堂互动方面进步明显，写作部分仍需老师持续带练。','下阶段建议把每周复盘固定下来，并增加英文写作输出频率。','建议在下一学期进一步积累项目经历，逐步过渡到升学方向准备。'),
  ('50000000-0000-0000-0000-000000000002','本学期学习状态积极，商科相关课程兴趣明显增强。','课堂参与度高，但作业细节和提交节奏仍需稳定。','建议建立错题复盘和任务清单，减少赶工式提交。','长期可逐步补充竞赛与活动经历，为商科申请建立更完整画像。'),
  ('50000000-0000-0000-0000-000000000003','整体学习自驱力较强，对升学目标有较明确认识。','生物与化学课程表现良好，口语表达还需要更多练习场景。','建议把面试表达训练纳入常规计划，并提前整理申请材料。','长期应围绕目标专业持续积累学术和实践经历，形成清晰申请故事线。');

INSERT INTO student_files (student_id, file_name, file_type, mime_type, file_path, file_size, description) VALUES
  ('50000000-0000-0000-0000-000000000001','math-midterm.pdf','pdf','application/pdf','/seed/students/lin-zhixia/math-midterm.pdf',248000,'数学期中成绩单'),
  ('50000000-0000-0000-0000-000000000001','class-note.png','image','image/png','/seed/students/lin-zhixia/class-note.png',182000,'课堂板书截图'),
  ('50000000-0000-0000-0000-000000000002','econ-summary.docx','docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','/seed/students/zhou-baiyan/econ-summary.docx',128000,'经济学课程总结'),
  ('50000000-0000-0000-0000-000000000003','ielts-speaking.txt','txt','text/plain','/seed/students/gu-qinghe/ielts-speaking.txt',2400,'口语练习记录');

INSERT INTO ppt_templates (
  id, name, category, status, source_file_name, source_file_path, cover_image_path, file_size,
  page_count, aspect_ratio, theme_name, template_version, parse_status, outline_json, pages_json,
  components_json, style_tokens_json, slot_bindings_json, parsed_at
) VALUES
  (
    '60000000-0000-0000-0000-000000000001','暖色家长沟通版','结业报告','published','warm-parent.pptx','/seed/templates/ppt/warm-parent.pptx','/seed/templates/ppt/warm-parent-cover.png',5242880,
    18,'16:9','Warm Family','v1','success',
    '[{"section":"封面"},{"section":"学习表现"},{"section":"家长建议"}]'::jsonb,
    '[{"page":1,"title":"封面"},{"page":2,"title":"学习表现概览"}]'::jsonb,
    '[]'::jsonb,
    '{"primary":"#FF8B5E","secondary":"#203047"}'::jsonb,
    '{"student_name":"title","term_overview":"text"}'::jsonb,
    NOW()
  ),
  (
    '60000000-0000-0000-0000-000000000002','极简升学规划版','学业规划','published','minimal-plan.pptx','/seed/templates/ppt/minimal-plan.pptx','/seed/templates/ppt/minimal-plan-cover.png',4380000,
    16,'16:9','Minimal Planning','v1','success',
    '[{"section":"目标设定"},{"section":"阶段规划"},{"section":"行动建议"}]'::jsonb,
    '[{"page":1,"title":"封面"},{"page":2,"title":"目标设定"}]'::jsonb,
    '[]'::jsonb,
    '{"primary":"#1F3C88","secondary":"#9BA4B5"}'::jsonb,
    '{"student_name":"title","long_term_plan":"text"}'::jsonb,
    NOW()
  );

INSERT INTO ppt_template_sections (id, ppt_template_id, section_order, section_title, start_page_no, end_page_no, page_count, summary) VALUES
  ('61000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',1,'封面',1,1,1,'用于展示学生名称与报告标题'),
  ('61000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001',2,'学习表现',2,10,9,'适合呈现成绩、课时和反馈内容'),
  ('61000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001',3,'家长建议',11,18,8,'适合总结建议与行动计划'),
  ('61000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000002',1,'目标设定',1,5,5,'适合展示阶段目标与方向'),
  ('61000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000002',2,'阶段规划',6,11,6,'适合展示路径规划和里程碑'),
  ('61000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000002',3,'行动建议',12,16,5,'适合展示下一阶段执行计划');

INSERT INTO ppt_template_pages (id, ppt_template_id, section_id, page_no, page_title, page_type, layout_name, notes, component_count, snapshot_path, raw_page_json) VALUES
  ('62000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001',1,'封面','cover','hero-cover','标题+副标题布局',3,'/seed/templates/ppt/page-1.png','{"layout":"cover"}'::jsonb),
  ('62000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000002',2,'学习表现概览','content','two-column','左文右图布局',4,'/seed/templates/ppt/page-2.png','{"layout":"summary"}'::jsonb),
  ('62000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002','61000000-0000-0000-0000-000000000004',1,'规划封面','cover','minimal-cover','极简标题布局',3,'/seed/templates/ppt/plan-page-1.png','{"layout":"cover"}'::jsonb),
  ('62000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000002','61000000-0000-0000-0000-000000000005',2,'阶段目标','content','clean-list','列表型规划布局',4,'/seed/templates/ppt/plan-page-2.png','{"layout":"list"}'::jsonb);

INSERT INTO ppt_template_components (
  id, ppt_template_id, page_id, component_order, component_type, component_name, placeholder_key,
  text_content, x, y, width, height, z_index, style_json, binding_hint, raw_component_json
) VALUES
  ('63000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000001',1,'title','主标题','student_name','学生姓名',1.2,1.0,8.0,1.0,1,'{"fontSize":28}'::jsonb,'学生姓名','{}'::jsonb),
  ('63000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000002',1,'text','概览文本','term_overview','学习表现概览',1.0,1.5,5.0,2.0,1,'{"fontSize":16}'::jsonb,'学期概述','{}'::jsonb),
  ('63000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002','62000000-0000-0000-0000-000000000003',1,'title','规划标题','student_name','学生姓名',1.1,0.9,7.8,1.0,1,'{"fontSize":30}'::jsonb,'学生姓名','{}'::jsonb),
  ('63000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000002','62000000-0000-0000-0000-000000000004',1,'text','长期规划','long_term_plan','长期规划',1.0,1.4,6.4,2.2,1,'{"fontSize":16}'::jsonb,'长期规划','{}'::jsonb);

INSERT INTO report_templates (id, name, report_type, status) VALUES
  ('70000000-0000-0000-0000-000000000001','标准结业报告','结业报告','published'),
  ('70000000-0000-0000-0000-000000000002','标准学业规划','学业规划','draft');

INSERT INTO report_template_sections (id, report_template_id, section_order, title, summary, content_points, data_bindings, recommended_pages) VALUES
  ('71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',1,'封面','展示学生基础信息与报告主题','["学生姓名","报告标题","学期信息"]'::jsonb,'["name","report_title","current_semester"]'::jsonb,'1页'),
  ('71000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',2,'学习表现概览','总结本学期整体学习状态与关键表现','["学期概述","优势学科","成绩表现"]'::jsonb,'["term_overview","strength_subjects","international_score"]'::jsonb,'2-3页'),
  ('71000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001',3,'课程反馈与建议','老师反馈与下一阶段建议','["课堂反馈","短期建议","长期建议"]'::jsonb,'["course_feedback","short_term_advice","long_term_roadmap"]'::jsonb,'2页'),
  ('71000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000002',1,'目标设定','明确学生当前目标和长期方向','["升学目标","职业方向","长期规划"]'::jsonb,'["study_intent","career_intent","long_term_plan"]'::jsonb,'2页'),
  ('71000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000002',2,'阶段规划','拆解执行节奏与里程碑','["课时规划","技能提升","重点任务"]'::jsonb,'["total_hours","skill_focus","skill_description"]'::jsonb,'3页'),
  ('71000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000002',3,'行动建议','给出近期可执行建议','["短期建议","材料准备","风险提醒"]'::jsonb,'["short_term_advice","report_subtitle","weakness"]'::jsonb,'2页');

INSERT INTO report_projects (id, student_id, report_type, report_template_id, ppt_template_id, prompt, status) VALUES
  ('80000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','结业报告','70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','生成春季结业报告，突出学习表现与家长沟通建议','draft'),
  ('80000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','学业规划','70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','生成学业规划报告，突出目标路径与行动计划','completed');

INSERT INTO report_project_pages (id, project_id, page_order, title, description, slide_hint, manual_text) VALUES
  ('81000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001',1,'封面','展示学生姓名、学期与报告主题','1页','可加入老师寄语一句话'),
  ('81000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001',2,'学习表现概览','突出本学期成绩、课时完成度和优势科目','2页','建议加入成绩趋势图'),
  ('81000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000002',1,'目标设定','明确申请方向与阶段目标','2页','补充时间线和里程碑'),
  ('81000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000002',2,'行动建议','整理长期规划和下一阶段任务','2页','加入执行建议和资源支持');

INSERT INTO report_project_page_bindings (id, project_page_id, binding_group, field_name, field_order) VALUES
  ('82000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','基础信息','name',1),
  ('82000000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000001','基础信息','report_title',2),
  ('82000000-0000-0000-0000-000000000003','81000000-0000-0000-0000-000000000002','学习表现','term_overview',1),
  ('82000000-0000-0000-0000-000000000004','81000000-0000-0000-0000-000000000002','学习表现','strength_subjects',2),
  ('82000000-0000-0000-0000-000000000005','81000000-0000-0000-0000-000000000003','目标设定','study_intent',1),
  ('82000000-0000-0000-0000-000000000006','81000000-0000-0000-0000-000000000004','行动建议','long_term_plan',1);

INSERT INTO report_project_page_files (id, project_page_id, file_name, file_type, mime_type, file_path, file_size, description) VALUES
  ('83000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002','score-chart.png','image','image/png','/seed/projects/project-1/score-chart.png',188000,'成绩趋势图'),
  ('83000000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000004','plan-note.txt','txt','text/plain','/seed/projects/project-2/plan-note.txt',2200,'规划补充说明');

INSERT INTO project_chat_messages (id, project_id, role, content) VALUES
  ('84000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','user','请把成绩提升部分写得更具体一些'),
  ('84000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001','assistant','可以，我会把成绩变化和老师反馈结合起来整理。'),
  ('84000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000002','user','目标设定页需要更明确的时间线'),
  ('84000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000002','assistant','已补充按季度拆分的执行节奏。');

INSERT INTO generation_histories (id, project_id, student_id, report_title, ppt_template_id, report_template_id, output_format, status, output_file_path) VALUES
  ('90000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','林知夏 2026 春季结业报告','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','pptx','draft','/outputs/lin-zhixia-term-report.pptx'),
  ('90000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','顾清禾 学业规划报告','60000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002','pptx','completed','/outputs/gu-qinghe-plan-report.pptx');

COMMIT;
