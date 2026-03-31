from app.models.schemas import OutlineBlock, ReportGenerationRequest


class AIOutlineService:
  def build_outline(self, request: ReportGenerationRequest, template_name: str) -> list[OutlineBlock]:
    page_hint = max(request.pageCount // 6, 2)

    outline = [
      OutlineBlock(title='封面与学员画像', description=f'基于模板《{template_name}》展示学员基础信息、课程周期和一句总评。', slideHint='2 页', emphasis='封面可插入头像、课程名称与本期关键词'),
      OutlineBlock(title='成绩趋势分析', description='整合阶段测、月考和模块测成绩，输出图表和提分结论。', slideHint=f'{page_hint} 页', emphasis='适合折线图、柱状图和班级对比'),
      OutlineBlock(title='课堂表现与互动', description='基于课堂观察、提问次数和老师评语生成表现总结。', slideHint=f'{page_hint} 页', emphasis='适合插入案例截图与老师原话'),
      OutlineBlock(title='作业完成与习惯养成', description='展示完成率、订正率、迟交情况和习惯标签。', slideHint='3 页', emphasis='适合作业热力图和重点问题拆解'),
      OutlineBlock(title='下阶段学习建议', description=f'结合 {request.tone} 风格输出家长建议、续班建议和目标规划。', slideHint='4 页', emphasis='可按年级自动切换语气与表达深度'),
      OutlineBlock(title='附录与课程计划', description='生成后续学习重点、课时规划和备注说明页。', slideHint='2 页', emphasis='用于内部交付与家长会场景'),
    ]

    if request.includeModules:
      requested = set(request.includeModules)
      outline = [block for block in outline if any(keyword in block.title for keyword in requested)] or outline

    return outline
