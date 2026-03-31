from app.models.schemas import (
  DataManagementData,
  DataSource,
  GenerationMode,
  HistoryData,
  HistoryRecord,
  ImportRecord,
  Metric,
  ModuleItem,
  OutlineBlock,
  QueueItem,
  StudentRecord,
  TemplateCenterData,
  TemplateItem,
  WorkbenchData,
)


class MockRepository:
  def __init__(self) -> None:
    self._templates = [
      TemplateItem(id='term-growth', title='学期成长总评', description='适合 1 对 1 和精品小班，覆盖成绩趋势、学习表现、家校建议。', category='总结汇报', tags=['成绩趋势', '课堂表现', '家长建议'], slides=24, usageCount=1260, colorA='#153b5c', colorB='#ff9857'),
      TemplateItem(id='competition-report', title='竞赛班阶段复盘', description='突出知识点掌握度、错题聚类与下一阶段竞赛规划。', category='教育培训', tags=['竞赛复盘', '能力分层', '升阶路线'], slides=18, usageCount=860, colorA='#124e78', colorB='#4ad1c8', premium=True),
      TemplateItem(id='parent-communication', title='家长沟通汇报版', description='适合期末家长会，以直观语言说明孩子进步、风险与后续安排。', category='家校沟通', tags=['家长沟通', '风险提醒', '续班建议'], slides=22, usageCount=1510, colorA='#513252', colorB='#f39f5a'),
      TemplateItem(id='young-learners', title='低龄启蒙成长档案', description='偏图文与作品展示，适合小学生英语、思维训练、阅读写作课程。', category='教育培训', tags=['作品展示', '习惯养成', '成长轨迹'], slides=20, usageCount=730, colorA='#0d7c66', colorB='#f4c95d'),
      TemplateItem(id='class-batch', title='班课批量生成母版', description='面向几十位学员的批量导出场景，支持统一结构和差异化评语。', category='批量生成', tags=['批量导出', '模块插槽', '变量替换'], slides=26, usageCount=940, colorA='#1d3557', colorB='#72b01d'),
      TemplateItem(id='promotion-review', title='升学冲刺阶段报告', description='强调分数波动、薄弱模块和考前建议，适合中高考冲刺班。', category='总结汇报', tags=['分数对比', '薄弱项分析', '目标院校'], slides=28, usageCount=1110, colorA='#481d24', colorB='#ff7b54', premium=True),
    ]

    self._workbench = WorkbenchData(
      heroTips=['高二数学春季班结业报告', '小升初英语培优班', '竞赛班阶段成长复盘', '家长会沟通版'],
      modes=[
        GenerationMode(id='topic', label='输入主题', helper='让 AI 先生成结构与文案'),
        GenerationMode(id='upload', label='上传数据包', helper='适合已有 Excel/CSV/截图'),
        GenerationMode(id='outline', label='粘贴教学纪要', helper='按老师总结自动排版'),
      ],
      summary=[
        Metric(label='本期可生成学员', value='268', detail='已完成字段映射 241 人', accent='ink'),
        Metric(label='模板可直接套用', value='18', detail='支持家长版、班课版、竞赛版', accent='emerald'),
        Metric(label='平均生成时长', value='2.8 分钟', detail='20-28 页报告自动排版', accent='amber'),
        Metric(label='本周成功率', value='98.4%', detail='缺失数据自动提醒后可重试', accent='azure'),
      ],
      queue=[
        QueueItem(studentName='李沐阳', templateName='学期成长总评', eta='预计 01:30 完成', status='生成中', progress=72),
        QueueItem(studentName='赵一诺', templateName='家长沟通汇报版', eta='等待教师评语补齐', status='待补充', progress=44),
        QueueItem(studentName='高一竞赛班 12 人', templateName='竞赛班阶段复盘', eta='批量任务排队中', status='排队中', progress=28),
        QueueItem(studentName='王可欣', templateName='升学冲刺阶段报告', eta='已导出 PPT / PDF', status='已完成', progress=100),
      ],
      outline=[
        OutlineBlock(title='封面与核心结论', description='展示学员信息、课程周期、本学期关键词与一句总评。', slideHint='2 页', emphasis='适合插入头像、课程名和本期主目标'),
        OutlineBlock(title='成绩与能力变化', description='以图表说明月考、阶段测和模块得分变化，突出提升点与波动点。', slideHint='4 页', emphasis='自动生成折线图、雷达图和班级对比'),
        OutlineBlock(title='课堂表现复盘', description='结合课堂互动、提问次数、课堂笔记和知识点掌握情况。', slideHint='4 页', emphasis='可插入老师课堂评语和作品截图'),
        OutlineBlock(title='作业与习惯追踪', description='展示作业完成率、订正质量、迟交情况与学习习惯标签。', slideHint='3 页', emphasis='适合配合周任务热力图'),
        OutlineBlock(title='典型案例页', description='选取代表性进步案例、错题修正前后对比或课堂小测片段。', slideHint='3 页', emphasis='可由 AI 从老师纪要中自动摘要'),
        OutlineBlock(title='家长沟通建议', description='输出下阶段陪伴重点、续班建议和家庭练习安排。', slideHint='4 页', emphasis='支持按年级自动切换表达风格'),
        OutlineBlock(title='附录与下阶段计划', description='生成课程规划、目标节点和备注说明页。', slideHint='2 页', emphasis='用于转化续班或升阶课程'),
      ],
      suggestedTemplates=self._templates[:3],
    )

    self._template_center = TemplateCenterData(
      categories=['全部', '总结汇报', '教育培训', '家校沟通', '批量生成'],
      featured=self._templates[0],
      templates=self._templates,
      modules=[
        ModuleItem(name='成绩趋势模块', description='自动识别考试时间轴并生成折线图、同比环比说明。', recommendedSlides='2-4 页'),
        ModuleItem(name='课堂表现模块', description='根据课堂观察记录插入标签、引用老师评语和案例截图。', recommendedSlides='2-3 页'),
        ModuleItem(name='作业完成模块', description='展示完成率、订正率、拖延率及问题清单，适合家长沟通。', recommendedSlides='2-3 页'),
        ModuleItem(name='续班建议模块', description='按课程产品自动拼接升阶班、强化班或冲刺班建议。', recommendedSlides='1-2 页'),
        ModuleItem(name='家长会讲稿模块', description='同步生成教师口播提纲和家长会展示版节奏。', recommendedSlides='1 页'),
        ModuleItem(name='批量变量映射模块', description='支持姓名、班级、课程、老师评语、成绩图片等字段插槽。', recommendedSlides='全局配置'),
      ],
    )

    self._data_management = DataManagementData(
      stats=[
        Metric(label='已接入数据源', value='4', detail='教务、成绩、作业、教师评语', accent='ink'),
        Metric(label='最新同步时间', value='今天 14:20', detail='最近一次教务库增量同步', accent='azure'),
        Metric(label='待补齐字段', value='23 项', detail='主要缺少课堂评语与头像', accent='amber'),
        Metric(label='可直接生成学员', value='241 人', detail='数据完整度达到 90% 以上', accent='emerald'),
      ],
      sources=[
        DataSource(name='教务排课系统', description='同步姓名、班级、任课老师、上课周期和课程产品。', status='已同步', syncedAt='2026-03-30 14:20', coverage='268 / 268'),
        DataSource(name='成绩分析库', description='导入阶段测、月考、小测与单元检测成绩。', status='已同步', syncedAt='2026-03-30 13:45', coverage='261 / 268'),
        DataSource(name='作业平台', description='提取作业完成率、订正率、提交时间和错题标签。', status='同步中', syncedAt='2026-03-30 14:32', coverage='244 / 268'),
        DataSource(name='教师评语池', description='支持老师手动录入周评、课堂表现和家长沟通建议。', status='待补充', syncedAt='2026-03-30 12:10', coverage='198 / 268'),
      ],
      warnings=[
        '高一竞赛班仍有 8 位学员缺少阶段评语，生成时会自动降级为通用反馈。',
        '英语启蒙班中有 11 位学员头像缺失，封面会回退为彩色字母头像。',
        '部分 Excel 文件中课程名称写法不一致，建议先在字段映射页做一次别名归一。',
      ],
      imports=[
        ImportRecord(source='2026 春季班成绩表.xlsx', status='已导入', count='268 条记录', updatedAt='今天 13:48'),
        ImportRecord(source='课堂评语补充表.csv', status='部分失败', count='成功 192 / 205', updatedAt='今天 11:32'),
        ImportRecord(source='作业平台周报 API', status='自动同步', count='244 条记录', updatedAt='今天 14:32'),
      ],
      students=[
        StudentRecord(id='S001', name='李沐阳', grade='高二', className='数学春季培优 1 班', courses='导数专题 / 解析几何', score=92, homework=96, attendance=100, reportStatus='就绪', teacherNote='课堂提问积极，压轴题表达更完整，适合进入冲刺班。'),
        StudentRecord(id='S002', name='赵一诺', grade='高一', className='物理竞赛基础班', courses='力学模型 / 电磁学', score=87, homework=83, attendance=95, reportStatus='待补评语', teacherNote='基础计算稳定，综合题拆解思路需要老师补充案例说明。'),
        StudentRecord(id='S003', name='王可欣', grade='初三', className='中考英语冲刺班', courses='阅读理解 / 写作提升', score=90, homework=89, attendance=98, reportStatus='已生成', teacherNote='写作结构明显提升，家长沟通建议可强调词汇积累节奏。'),
        StudentRecord(id='S004', name='陈星宇', grade='六年级', className='小升初英语培优班', courses='词汇语法 / 听力表达', score=85, homework=91, attendance=92, reportStatus='就绪', teacherNote='课堂参与度高，适合增加口语展示型页面与作品截图。'),
        StudentRecord(id='S005', name='孙芷若', grade='四年级', className='启蒙阅读写作班', courses='阅读表达 / 观察写作', score=78, homework=94, attendance=100, reportStatus='待补头像', teacherNote='作业坚持度非常高，报告中建议突出习惯养成和作品成长。'),
        StudentRecord(id='S006', name='何嘉树', grade='高三', className='数学冲刺尖子班', courses='圆锥曲线 / 函数压轴', score=95, homework=88, attendance=96, reportStatus='就绪', teacherNote='建议重点展示难题得分率提升，并加入高考目标分规划。'),
      ],
    )

    self._history = HistoryData(
      stats=[
        Metric(label='本学期累计生成', value='186', detail='PPT 143 份 / PDF 43 份', accent='ink'),
        Metric(label='批量任务完成率', value='96.2%', detail='重试后大部分任务可恢复', accent='emerald'),
        Metric(label='平均导出页数', value='23.6 页', detail='支持按模板自动裁剪', accent='azure'),
        Metric(label='最近一次交付', value='今天 15:08', detail='高二数学春季班 36 份', accent='amber'),
      ],
      records=[
        HistoryRecord(id='JOB-20260330-001', title='高二数学春季班结业报告批量导出', template='学期成长总评', format='PPT / PDF', createdAt='2026-03-30 15:08', students='36 位学员', status='已完成', owner='陈老师', lastAction='已下载教师版 ZIP 包', notes='包含成绩趋势、课堂表现、家长建议和续班推荐。'),
        HistoryRecord(id='JOB-20260329-014', title='物理竞赛班阶段复盘', template='竞赛班阶段复盘', format='PPT', createdAt='2026-03-29 20:16', students='12 位学员', status='处理中', owner='王老师', lastAction='等待教师评语同步', notes='已完成知识点掌握度图表，剩余个性化总结待补充。'),
        HistoryRecord(id='JOB-20260328-009', title='小升初英语家长沟通版', template='家长沟通汇报版', format='PDF', createdAt='2026-03-28 18:42', students='28 位学员', status='已完成', owner='刘老师', lastAction='家长会版本已投屏演示', notes='自动压缩为 18 页，适合家长会讲解节奏。'),
        HistoryRecord(id='JOB-20260327-022', title='启蒙阅读写作成长档案', template='低龄启蒙成长档案', format='PPT / PDF', createdAt='2026-03-27 17:11', students='19 位学员', status='待复核', owner='孙老师', lastAction='等待替换 5 张课堂照片', notes='作品展示页已生成，建议老师补充课程瞬间照片。'),
        HistoryRecord(id='JOB-20260325-037', title='中考冲刺班成绩分析报告', template='升学冲刺阶段报告', format='PPT', createdAt='2026-03-25 22:05', students='42 位学员', status='已完成', owner='周老师', lastAction='已发送给班主任做二次批注', notes='已追加目标分规划和薄弱项题型建议页。'),
      ],
    )

  def get_workbench(self) -> WorkbenchData:
    return self._workbench.model_copy(deep=True)

  def get_template_center(self) -> TemplateCenterData:
    return self._template_center.model_copy(deep=True)

  def get_data_management(self) -> DataManagementData:
    return self._data_management.model_copy(deep=True)

  def get_history(self) -> HistoryData:
    return self._history.model_copy(deep=True)

  def find_template(self, template_id: str) -> TemplateItem | None:
    for template in self._templates:
      if template.id == template_id:
        return template.model_copy(deep=True)

    return None

  def append_history(self, record: HistoryRecord) -> None:
    self._history.records.insert(0, record)
    del self._history.records[12:]


repository = MockRepository()
