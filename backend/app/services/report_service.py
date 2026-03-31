from datetime import datetime

from app.models.schemas import HistoryRecord, ReportGenerationRequest, ReportGenerationResponse
from app.services.ai_outline import AIOutlineService
from app.services.mock_repository import MockRepository, repository
from app.services.ppt_generator import PPTGenerator


class ReportService:
  def __init__(
    self,
    repo: MockRepository | None = None,
    outline_service: AIOutlineService | None = None,
    generator: PPTGenerator | None = None,
  ) -> None:
    self.repo = repo or repository
    self.outline_service = outline_service or AIOutlineService()
    self.generator = generator or PPTGenerator()

  def create_report(self, request: ReportGenerationRequest) -> ReportGenerationResponse:
    template = self.repo.find_template(request.templateId)
    template_name = template.title if template else '自定义模板'
    outline = self.outline_service.build_outline(request, template_name)
    artifact = self.generator.generate(request, outline, template_name)
    task_id = f'TASK-{datetime.now().strftime("%Y%m%d%H%M%S")}'

    history_record = HistoryRecord(
      id=task_id,
      title=request.topic,
      template=template_name,
      format=request.outputFormat.upper(),
      createdAt=datetime.now().strftime('%Y-%m-%d %H:%M'),
      students=f'{len(request.studentIds) or 1} 位学员',
      status='已完成' if artifact.status == 'created' else '待处理',
      owner='系统任务',
      lastAction='已写入生成历史',
      notes='由演示接口触发生成，可继续替换为真实数据库与对象存储逻辑。',
    )
    self.repo.append_history(history_record)

    if artifact.status == 'dependency_missing':
      message = '检测到未安装 python-pptx，已输出占位说明文件。安装依赖后即可生成真正的 PPT。'
    else:
      message = '已生成演示版 PPT 文件。下一步可以接入真实数据、图表和 PDF 转换服务。'

    return ReportGenerationResponse(
      taskId=task_id,
      status='success',
      message=message,
      artifact=artifact,
      outline=outline,
    )


report_service = ReportService()
