# Cato2 页面 API 接口整理

> 范围：`src/app/home`、`analyze-new`、`identification`、`manual-merge-v3`、`merge-before`、`knowledge-base-cato`、`company-management`、`account-settings`、`brand-editor`、`brand-settings`。
>

## Home(首页)

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取项目列表，支持筛选、分页、排序参数透传 | `fetchProjectList` | `GET` | `/project/list` | `page={page}&per_page={per_page}&project_name={project_name}` | [见下方示例](#获取项目列表返回示例) |
| 删除项目 | `deleteProject` | `DELETE` | `/project/{projectId}` | `projectId: number \| string` | - |
| 更新项目基础信息 | `updateProject` | `PUT` | `/project/{project.project_id}` | `{project_id: string, project_name: string, project_description: string, is_favorite: boolean, attributes: object}` |  |
| 获取 takeoff 列表 | `getAllTakeoffList`  | `GET` | `/project/take_off/list?page={page}&per_page={per_page}` | `page={page}&per_page={per_page}` | [见下方示例](#获取takeoff列表返回示例) |
| 删除 takeoff | `deleteTakeoffById` | `DELETE` | `/project/take_off/delete/take_off_id?take_off_id={takeOffId}` | `takeOffId: string` | |
| 修改 takeoff 名称等信息 | `updateTakeOffInfo` | `PUT` | `/project/take_off/edit/take_off_id` | `{ id: takeOffId, name: string }` |  |
| 查询 takeoff merge 状态 | `getMergeStatusByTakeOffId` | `GET` | `/drawing-ai/drawing_ai/get_merge_status_by_take_off_id?take_off_id={id}` | `take_off_id: number` | merge 状态响应体 [见下方示例](#Takeoff文件状态返回示例) |

### 获取项目列表返回示例
```json
{
  "items": [
    {
      "project_name": "6407 WESTGATE DR 999",
      "attributes": {},
      "project_id": "01KRXQ6F7H9H6NABP3X24XMRB0",
      "create_time": "2026-05-18T14:17:49",
      "create_user": "yaodzz@gmail.com",
      "update_time": "2026-05-18T14:18:57",
      "update_user": "yaodzz@gmail.com",
      "last_update": 0,
      "is_favorite": false
    }
  ],
  "page": 1,
  "per_page": 30,
  "total_count": 340,
  "total_pages": 12
} 
```

### 获取takeoff列表返回示例
```json
{
    "items": [
        {
            "name": "lwg01 Takeoff #2",
            "project_id": "01KQ9BBZ830R6EP018NB97TPNS",
            "project_file_ids": "666",
            "status": 1,
            "status_desc": "Uploaded",
            "original_result": "[]",
            "hinge_status": 1,
            "country_of_origin": "United States",
            "notes": "",
            "create_time": "2026-05-07T01:55:01",
            "update_time": "2026-05-07T01:55:01",
            "update_user": "wangyuncong",
            "create_user": "wangyuncong",
            "last_update": 12,
            "id": 557,
            "project_name": "lwg01",
            "project_desc": null
        }
    ],
    "page": 1,
    "per_page": 30,
    "total_count": 469,
    "total_pages": 16
}
```

### Takeoff文件状态返回示例
```json
{
    "files": {
        "681": {
            "status": "合并中" // 未处理 ｜ 立面图平面图复核中 ｜立面图平面图复核完 ｜ schedule复核中 ｜ schedule已经复核完 ｜ 合并中 ｜ 合并完
        }
    },
    "take_off_completed": false
}
```

## Upload Files And Parse （文件上传和自动解析界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|----------------|-----------|---------|---|---|---|
| 上传文件 | `uploadFilesNoProjectId` | `POST` | `/project/file/create_and_upload_files?hinge_status=${hinge_status=${hinge_status}` | {"files":"type binary" , "metas":[{"file_name":"#122 - 6407 Westgate - Permit Set 20230711.pdf",<br />"operation_type":"Architecture_drawing","file_type":"PDF","country_of_origin":"United States"}],<br />"project_id": string | null} | 参数project_id为null时，上传文件的同时创建新的project，否则在指定project上传文件 |
| 初始化文件解析任务 |  | `POST` | `/sse/classify-pages-from-project-file-init` | `project_file_id=694&model_name=unit_detect_11x_v1&confidence_threshold=0.35<br />&iou_threshold=0.45&dpi=100&enable_ai_classification=true&max_concurrent_batches=6` | [见下方示例](#初始化文件解析任务返回示例) |
| 获取文件解析进度 |  | `SSE` | `/sse/classify-status/{request_id}` | `request_id: string` | [见下方示例](#获取文件解析进度返回示例) |

### 初始化文件解析任务返回示例
```json
{
    "request_id": "625c0763-75dd-4b73-83ea-f6d25a8f07fe",
    "sse_url": "/api/sse/classify-status/625c0763-75dd-4b73-83ea-f6d25a8f07fe",
    "status_url": "/api/pdf/batch/classify-status/625c0763-75dd-4b73-83ea-f6d25a8f07fe",
    "message": "Task started. Connect to SSE URL for real-time progress.",
    "filename": "#122 - 6407 Westgate - Permit Set 20230711.pdf",
    "project_file_id": 694,
    "initiated_by": "wangyuncong"
}
```
### 获取文件解析进度返回示例
```json
{"type": "PROGRESS", "progress": 1.0, "message": "[DB-DEBUG] classify_pdf_pages RETURN", "level": "INFO", "timestamp": "2026-05-19T09:08:31.451322"},
{"type": "COMPLETED", "progress": 1.0, "result":{}}
```


## Page Index （页面分型界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取takeoff详情 <a id="api-get-takeoff-by-id"></a> | `getTakeOffById` | `GET` | `/project/take_off/take_off_id?take_off_id={takeOffId}` | `takeOffId: string` |  |
| 获取文件工作流 | `getTakeOffMergeFlowsById` | `GET` | `/drawing-ai/drawing_ai/get_merge_flows_by_take_off_id?take_off_id={takeOffId}` | `takeOffId: string` |  |
| 回滚到指定的工作流步骤 | `rollbackTakeOffByMergeFlowStatus` | `POST` | `/drawing-ai/drawing_ai/rollback_take_off_by_merge_flow_status?take_off_id=${take_off_id}&status=${status}` |  |  |
| 获取左侧页面分型列表 | `getDrawingIndexInfoById` | `GET` | `/pdf/get-drawing-index-from-project?project_id=${projectId}&file_id=${fileId}` | `projectId`, `fileId`, `params?` |  |
| 根据文件id获取evidence框 <a id="api-get-evidence-by-file-id"></a> | `getEvidenceByFileId` | `GET` | `/evidence/all/project_file?project_id=${projectId}&file_id=${fileId}` | `projectId`, `fileId`, `params?` |  |
| 更新左侧页面类型 | `updatePageType` | `POST` | `/pdf/project/page/type?project_file_id=${fileId}&page_number=${pageNum}` | `fileId`, `pageNum`, `params?` |  |



## Page Index To Manual seleciton （手动画框重新识别页面分型界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 根据文件id获取evidence框 <a id="api-get-evidence-by-file-id"></a> | `getEvidenceByFileId` | `GET` | `/evidence/all/project_file?project_id=${projectId}&file_id=${fileId}` |  |  |
| 添加evidence <a id="api-add-evidence"></a> | `evidenceBatchSubmit` | `POST` | `/evidence/save/new/list` |  |  |
| 删除单个evidence | `deleteEvidenceById` | `DELETE` | ` /evidence/delete?evidence_id={evidenceId}` | `evidenceId: string` |  |
| 批量删除evidence <a id="api-batch-delete-evidence"></a> | `evidenceBatchDelete` | `DELETE` | `/evidence/batch/delete` |  |  |
| 修改evidence <a id="api-update-evidence"></a> | `evidenceBatchUpdate` | `PUT` | `/evidence/batch/update` |  |  |
| 根据页面画的section box重新识别页面分型  | `recognizeDrawingIndex` | `POST` | `/pdf/extract-drawing-index-from-project?project_id=${projectId}&file_id=${fileId}` |  |  |



## Page Labeling （页面类型标注界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| [获取takeoff详情](#api-get-takeoff-by-id) |
| [根据文件id获取evidence框](#api-get-evidence-by-file-id) |
| 获取PDF页面类型分析汇总 | `getPdfAnalyseSummary` | `GET` | `/pdf/pdf-analysis/{fileId}/summary` | `fileId: string` |  |
| 获取 box types <a id="api-get-box-types"></a> | `getBoxTypes` | `GET` | `/box_types/list?company_id={company_id}` | `company_id: string` | box type 列表响应体 |
| 新增 box type <a id="api-create-box-type"></a> | `createBoxType` | `POST` | `/box_types/create/{company_id}` | `company_id`, body: `{ name, description, color, search_prompt, analysis_prompt }` | 新增后的 box type 响应体 |
| 更新 box type <a id="api-update-box-type"></a> | `updateBoxType` | `PUT` | `/box_types/update/{company_id}/{box_id}` | `company_id`, `box_id`, body 同新增 | 更新后的 box type 响应体 |
| 删除 box type <a id="api-delete-box-type"></a> | `deleteBoxType` | `DELETE` | `/box_types/delete/{company_id}/{box_id}` | `company_id`, `box_id` | 删除结果响应体 |
| [添加evidence](#api-add-evidence) |
| [删除/批量删除evidence](#api-batch-delete-evidence) |
| [修改evidence](#api-update-evidence) |
| 获取 takeoff/file 下分组 evidence（解析前调用） | `getGroupedEvidencesByTakeOffAndFile` | `GET` | `/drawing-ai/drawing_ai/get_grouped_evidences_by_take_off_and_file?take_off_id={take_off_id}&file_id={file_id}` | `take_off_id`, `file_id` | grouped evidence 响应体 |
| 解析API-1（为文件生成 schedule / floor plan / elevation 等 evidence key） | `generateFileKeysByProjectFileIds` | `POST` | `/drawing-ai/drawing_ai/generate_file_keys_by_project_file_ids?project_file_ids={ids}` | `project_file_ids: string` | 文件 key 生成结果响应体 |
| 解析API-2（enrich floor plan / elevation 小 item） | `enrichElevationFloorPlanByEvidenceIds` | `POST` | `/drawing-ai/drawing_ai/enrich_elevation_floor_plan_by_evidence_ids?evidence_ids={ids}` | `evidence_ids: string` | enrich 结果响应体 |



## Sources Preview （floor plan 和 elevation 预览审核界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取左侧floor/elevation列表 | `getEvidencesElevationFloorPlanWithUrlByProjectFileId` | `GET` | `/drawing-ai/drawing_ai/get_evidences_elevation_floor_plan_with_url_by_project_file_id?project_file_id={id}` | `project_file_id: string` | floor/elevation evidence 响应体 |
| 获取文件下schedule列表 <a id="api-get-schedule-by-file-id"></a> | `getEvidencesWindowTableQuoteWithUrlByProjectFileId` | `GET` | `/drawing-ai/drawing_ai/get_evidences_window_table_quote_with_url_by_project_file_id?project_file_id={id}` | `project_file_id: string` | schedule/table evidence 响应体 |
| 获取 floor/elevation 对应的对应的item列表 | `getEvidenceBySubTextEvidenceIds` | `GET` | `/drawing-ai/drawing_ai/get_evidence_by_sub_text_evidence_ids?evidence_ids={ids}` | `evidence_ids: string` | sub text evidence 响应体 |
| 获取提示词模板列表 | `getTemplates` | `GET` | `/prompt-template/list?company_id={company_id}&page={page}&per_page={perPage}` | `company_id`, `page?`, `perPage?` | 模板分页列表响应体 |
| [获取提示词模版列表](#api-get-templates) |
| [增加item](#api-add-evidence) | 
| [删除item](#api-batch-delete-evidence) | 
| [修改/批量修改item](#api-update-evidence) |
| 解析 | `AnalyzeItemBySourceTypeSSE` | `EventSource` | `/drawing-ai/drawing_ai/analyze_item_by_source_type?take_off_id={take_off_id}&template_id={template_id}` | `take_off_id`, `template_id`, callbacks | SSE 事件数据，包含 `running` / `success` / `error` / `cancelled` 等状态 |
| [获取 takeoff/file 下分组 evidence](#api-get-evidence-by-file-id) |



## Schedule Preview （schedule 预览审核界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| [获取文件下schedule列表](#api-get-schedule-by-file-id) |
| 获取 schedule evidence 下 items列表 | `getTakeOffResultItemsByEvidenceIds` | `GET` | `/drawing-ai/drawing_ai/get_take_off_result_items_by_evidence_ids?evidence_id={id}` | `evidence_id: string` | schedule item 列表响应体 |
| 更新 schedule item | `updateTakeOffResultItemResultById` | `POST` | `/drawing-ai/drawing_ai/update_take_off_result_item_result_by_id?take_off_result_item_id={id}` | `take_off_result_item_id`, body: `data` | 更新结果响应体 |
| 删除 schedule item | `deleteTakeOffResultItemById` | `DELETE` | `/drawing-ai/drawing_ai/delete_take_off_result_item_by_id?take_off_result_item_id={id}` | `take_off_result_item_id` | 删除结果响应体 |
| 新增 schedule item | `addTakeOffResultItemByEvidenceId` | `POST` | ` /drawing-ai/drawing_ai/add_take_off_result_item` | body: `{ take_off_id, project_file_id, evidence_id, result, coordinates? }` | 新增 item 响应体 |
| 复制 schedule items | `addMultipleTakeOffResultItems` | `POST` | `/drawing-ai/drawing_ai/add_take_off_result_items` | body: `data: any` | 批量新增结果响应体 |
| 批量修改 schedule items | `updateMultipleTakeOffResultItems` | `POST` | `/drawing-ai/drawing_ai/update_take_off_result_item_result_by_id_list` | body: `data: any` | 批量更新结果响应体 |
| 批量删除 schedule items | `deleteMultipleTakeOffResultItems` | `DELETE` | `/drawing-ai/drawing_ai/delete_take_off_result_item_by_id_list?take_off_result_item_ids={ids}` | `take_off_result_item_ids: string` | 批量删除结果响应体 |
| 手动补充 schedule源上 sub item 框 | `addTakeOffResultItemManual` | `POST` | `/drawing-ai/drawing_ai/add_take_off_result_item_manual` | body: `{ take_off_id, project_file_id, evidence_id, result, coordinates }` | 新增 item 响应体 |
| 校验 schedule sub label | `validateScheduleSubLabelsByTakeOffAndFile` | `GET` | `/drawing-ai/drawing_ai/validate_schedule_sub_labels_by_take_off_and_file?take_off_id={take_off_id}&file_id={file_id}` | `take_off_id`, `file_id` | 校验结果响应体 |




## Manual Merge V3 （手动合并界面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取左侧 label 分组 | `getGroupedLabelsByFileAndTakeOff` | `GET` | `/drawing-ai/drawing_ai/get_grouped_labels_by_file_and_take_off?take_off_id={take_off_id}&file_id={file_id}` | `take_off_id`, `file_id` | label 分组响应体 |
| 获取指定 label 的 Schedule/Floor Plan/Elevation/Finally Data 数据 | `getFileSourceMergeResultsByLabel` | `GET` | `/drawing-ai/drawing_ai/get_file_source_merge_results_by_label?take_off_id={take_off_id}&file_id={file_id}&label={label}` | `take_off_id`, `file_id`, `label` | source merge result 响应体 |
| 获取 source evidence URLs <a id="api-get-evidence-urls-by-ids"></a> | `getTakeOffEvidenceUrlsByIds` | `GET` | `/drawing-ai/drawing_ai/get_evidence_urls_by_take_off_result_item_ids?take_off_result_item_ids={ids}` | `result_item_ids: string` | evidence URL 列表响应体 |
| 获取字段列 | `getTemplateById` | `GET` | `/prompt-template/{templateId}` | `templateId` | 模板详情响应体 |
| Merge Complete按钮（校验并创建 single file merge result） | `checkFileSourceMergeResultsAndCreateSingleFileResults` | `POST` | `/drawing-ai/drawing_ai/check_file_source_merge_results_and_create_single_file_results?take_off_id={take_off_id}&file_id={file_id}&ids={ids}` | `take_off_id`, `file_id`, `ids`, body: `data` | 创建 single file merge result 响应体 |
| Save 按钮（更新已合并 label 的 single file merge results） | `updateSingleFileMergeResultsByIdList` | `POST` | `/drawing-ai/drawing_ai/update_single_file_merge_results_by_id_list` | body: `data` | 批量更新结果响应体 |
| 删除未合并 item | `deleteFileSourceMergeResultByIdList` | `DELETE` | `/drawing-ai/drawing_ai/delete_file_source_merge_result_by_ids?result_ids={ids}` | `result_ids: string` | 删除结果响应体 |
| 删除已合并 item | `deleteSingleFileMergeResultByIdList` | `DELETE` | `/drawing-ai/drawing_ai/delete_single_file_merge_result_by_ids?result_ids={ids}` | `result_ids: string` | 删除结果响应体 | 
| Split 按钮（将未合并 items split 到目标 label） | `splitFileSourceMergeResultsByIdList` | `POST` | `/drawing-ai/drawing_ai/split_file_source_merge_results_by_ids?take_off_id={take_off_id}&file_id={file_id}&file_source_merge_result_ids={ids}&label={label}` | `take_off_id`, `file_id`, `file_source_merge_result_ids`, `label` | split 结果响应体 |
| Undo Merge按钮（撤销已合并 label） | `rollbackSingleFileMergeResultByIds` | `POST` | `/drawing-ai/drawing_ai/rollback_single_file_merge_result_by_ids?ids={ids}` | `ids: string` | rollback 结果响应体 |
| schedule上手动画框 | `addTakeOffResultItemManualMerge` | `POST` | `/drawing-ai/drawing_ai/add_take_off_result_item_manual_merge` | body: `{ take_off_id, project_file_id, evidence_id, result, coordinates }` | 新增 item 响应体 |
| source中删除evidence | `deleteFileSourceMergeResultsByEvidenceIds` | `DELETE` | `/drawing-ai/drawing_ai/delete_file_source_merge_results_by_evidence_ids?evidence_ids={ids}` | `evidence_ids: string` | 删除结果响应体 |
| 修改 source evidence 归属 label | `updateSingleFileMergeResultsLabelByEvidenceIds` | `POST` | `/drawing-ai/drawing_ai/update_file_source_merge_result_label_by_evidence_ids?evidence_ids={ids}&label={label}` | `evidence_ids`, `label` | 更新 label 结果响应体 |
| 新增floor plan或者elevation框（ 在 PDF 上新增 source 框并同步 source merge result） | `saveNewListAndSyncFileSourceMergeResult` | `POST` | `/drawing-ai/drawing_ai/save_new_list_and_sync_file_source_merge_result?take_off_id={take_off_id}&file_id={file_id}&source_type={source_type}` | `take_off_id`, `file_id`, `source_type`, body: `data` | 保存并同步结果响应体 |
| 创建最终 multiple files merge result | `autoCreateMultipleFilesMergeResultByTakeOffId` | `POST` | ` /drawing-ai/drawing_ai/auto_create_multiple_files_merge_result_by_take_off_id?take_off_id={take_off_id}` | `take_off_id` | multiple files merge result 创建响应体 |



## Analyze New （最终结果输出页面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取 takeoff 结果统计 | `getTakeOffSummaryStats` | `GET` | `/drawing-ai/drawing_ai/take_off_result/stats?take_off_id={take_off_id}` | `take_off_id: any` | 统计数据响应体 |
| 获取 items列表 | `getAllTakeOffResultItemsByTakeOffId` | `GET`| `/drawing-ai/drawing_ai/get_all_multiple_files_merge_results_sorted_by_label?take_off_id={take_off_id}` | `take_off_id: string` | 最终结果 item 列表响应体 |
| 下载 takeoff result | `downloadTakeOffResult` | `POST` | `/drawing-ai/drawing_ai/take_off_result/download?take_off_id={take_off_id}` | `take_off_id: string` | 下载结果响应体 |
| 重置 takeoff | `resetTakeOff` | `GET` | `/drawing-ai/drawing_ai/reset_take_off_and_hard_delete_by_take_off_and_files?take_off_id={take_off_id}&file_ids={file_ids}` | `take_off_id: string`, `file_ids: string` | 重置结果响应体 |
| 更新 item | `updateTakeOffResultItem` | `POST` | `/drawing-ai/drawing_ai/update_multiple_files_merge_result_by_id?result_id={result_id}` | `result_id: string`, body: `data` | 更新结果响应体 |
| 复制最终 item | `copyMultipleFilesMergeResultByIds` | `POST` | `/drawing-ai/drawing_ai/copy_multiple_files_merge_result_by_id` | body: `{ take_off_id, result_id }` | 复制结果响应体 |
| 删除/批量删除 item | `deleteTakeOffResultItemList` | `DELETE` | `/drawing-ai/drawing_ai/delete_multiple_files_merge_result_by_ids?result_ids={result_ids}` | `result_ids: string` | 删除结果响应体 |
| [获取 source evidence URLs](#api-get-evidence-urls-by-ids) |



## Knowledge Base Cato （提示词模版页面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取提示词模版列表 <a id="api-get-templates"></a> | `getTemplates` | `GET` | `/prompt-template/list?company_id={company_id}&page={page}&per_page={perPage}` | `company_id`, `page?`, `perPage?` | 模板分页列表响应体 |
| 获取模板详情 | `getTemplateById` | `GET` | `/prompt-template/{templateId}` | `templateId` | 模板详情响应体 |
| 新建模板 | `createTemplate` | `POST` | `/prompt-template` | body: `settings: any` | 新建模板响应体 |
| 更新模板基础信息/prompt | `updateTemplate` | `PUT` | `/prompt-template/{templateId}` | `templateId`, body: `settings` | 更新后的模板响应体 |
| 删除模板 | `deleteTemplate` | `DELETE` | `/prompt-template/{templateId}` | `templateId` | 删除结果响应体 |
| 设置默认模板 | `setTemplateDefault` | `POST` | `/prompt-template/{templateId}/set-default?company_id={company_id}` | `templateId`, `company_id` | 设置结果响应体 |
| 复制模板 | `copyTemplate` | `POST` | `/prompt-template/{templateId}/copy` | `templateId`, body: `{ company_id, name }` | 复制后的模板响应体 |
| 新增模板字段 | `createField` | `POST` | `/prompt-template/{templateId}/field` | `templateId`, body: `field` | 新增字段响应体 |
| 更新模板字段 | `updateField` | `PUT` | `/prompt-template/{templateId}/field/{fieldId}` | `templateId`, `fieldId`, body: `field` | 更新字段响应体 |
| 导入模板 JSON | `importTemplate` | `POST` | `/prompt-template/import-json` | multipart: `company_id`, `template_json_file` | 导入结果响应体 |
| 下载模板 JSON | `downloadTemplateJson` | `GET` | `/prompt-template/{template_id}/download-json?template_id={template_id}` | `template_id` | Blob 文件流 |



## Company Management （公司管理页面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取公司列表 | `getCompanyList` | `GET` | `/company/list?page={page}&per_page={per_page}&name={name?}` | `{ page, per_page, name? }` | 公司分页列表响应体 |
| 创建公司 | `createCompany` | `POST` | `/company` | body: `companyData` | 新建公司响应体 |
| 更新公司信息 | `updateCompanyByCompanyId` | `PUT` | `/company/{companyId}` | `companyId`, body: `companyData` | 更新后的公司响应体 |
| 删除公司 | `deleteCompanyByCompanyId` | `DELETE` | `/company/{companyId}` | `companyId` | 删除结果响应体 |
| 获取公司联系人 | `getContactListByCompanyId` | `GET` | `/company/{companyId}/contacts` | `{ companyId }` | 联系人列表响应体 |
| 新增公司联系人 | `createCompanyContact` | `POST` | `/company/{companyId}/contact` | `{ companyId, contactData }` | 新增联系人响应体 |
| 更新公司联系人 | `updateCompanyContact` | `PUT` | `/company/{companyId}/contact/{contactId}` | `{ companyId, contactId, contactData }` | 更新联系人响应体 |
| 删除公司联系人 | `deleteCompanyContact` | `DELETE` | `/company/{companyId}/contact/{contactId}` | `{ companyId, contactId }` | 删除结果响应体 |
| 绑定用户为管理员 <a id="api-bind-user-to-admin"></a> | `bindUserToAdmin` | `POST` | `/auth/bind_user_to_admin?user_id={userId}` | `userId` | 绑定结果响应体 |
| 解绑用户为管理员 <a id="api-unbind-user-from-admin"></a> | `unbindUserToAdmin` | `POST` | `/auth/unbind_user_from_admin?user_id={userId}` | `userId` | 解绑结果响应体 |
| 绑定超级管理员 <a id="api-bind-user-to-super-admin"></a> | `bindUserToSuperAdmin` | `POST` | `/auth/bind_user_to_super_admin?user_id={userId}` | `userId` | 绑定结果响应体 |
| 解绑超级管理员 <a id="api-unbind-user-from-super-admin"></a> | `unbindUserFromSuperAdmin` | `POST` | `/auth/unbind_user_from_super_admin?user_id={userId}` | `userId` | 解绑结果响应体 |




## Account Settings （账号设置页面）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|--------------|---|---|---|---|---|
| 获取当前公司团队成员 | `getContactsByCompanyId` | `GET` | `/company/{company_id}/contacts` | `{ company_id }` | 团队成员列表响应体 |
| 新增联系人/用户 | `createContact` | `POST` | `/company/{company_id}/contact` | `{ company_id, contact_data }` | 新增联系人响应体 |
| 获取当前登录用户联系人资料 | `getContactByKeycloakUser` | `GET` | `/company/get_company_contact_by_keycloak_user/` | 无 | 当前用户联系人资料响应体 |
| 更新用户资料 | `updateUser` | `POST` | `/admin/dealer/user` | `UserDataForUpdate`，表单 `URLSearchParams` | 用户更新结果响应体 |
| 修改密码 | `changePassword` | `POST` | `/admin/dealer/user` | `PasswordChangeData`，`qs.stringify(data)` | 密码修改结果响应体 |
| [绑定用户为管理员](#api-bind-user-to-admin) | 
| [解绑用户为管理员](#api-unbind-user-from-admin) |
| [绑定用户为超级管理员](#api-bind-user-to-super-admin) |
| [解绑用户为超级管理员](#api-unbind-user-from-super-admin) |
| 当前登陆用户是否为公司管理员 | `isUserAdmin` | `GET` | `/auth/is_admin` |  |  |
| 当前登陆用户是否为超级管理员 | `isUserSuperAdmin` | `GET` | `/auth/is_super_admin` |  |  |



## Your Company（当前公司页面，对应的文件夹是brand-editor）

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|--------------|---|---|---|---|---|
| 获取当前用户公司 | `fetchCompanyByKeycloakUser` | `GET` | `/company/get_company_by_keycloak_user/` | 无 | 当前公司响应体 |
| 获取公司联系人 | `getContactsByCompanyId` | `GET` | `/company/{company_id}/contacts` | `{ company_id }` | 联系人列表响应体 |
| 更新公司 logo | `updateCompanyLogoByCompanyId` | `PUT` | `/company/{companyId}/photo` | `companyId`, multipart `file` | 更新后的 logo / 公司响应体 |
| 更新公司信息/项目设置 | `updateCompanyByCompanyId` | `PUT` | `/company/{companyId}` | `companyId`, body: `companyData` | 更新后的公司响应体 |
| [绑定用户为管理员](#api-bind-user-to-admin) | 
| [解绑用户为管理员](#api-unbind-user-from-admin) |
| [绑定用户为超级管理员](#api-bind-user-to-super-admin) | 
| [解绑用户为超级管理员](#api-unbind-user-from-super-admin) |


## Project Settings (项目设置界面，对应的文件夹是brand-settings，这个页面目前是隐藏的，由于界面功能尚不清楚，目前只能通过代码查找API，没有进行界面核对)

| <div style="width: 120px;">API 功能</div> | Service | Method | 接口路径 | 参数 | <div style="width: 120px;">实际接口返回值</div> |
|---|---|---|---|---|---|
| 获取产品类型库 | `fetchProductTypesLibrary` | `GET` | `/product_types_library/all` | 无 | 产品类型库响应体 |
| 获取 operability 库 | `fetchOperabilityLibrary` | `GET` | `/operability_library/all` | 无 | operability 库响应体 |
| 获取公司 profile 列表 | `fetchAllProfileByCompanyId` | `GET` | `/profile/all/{companyId}` | `companyId` | profile 列表响应体 |
| 创建产品编辑 profile | `createProfile` | `POST` | `/profile/create_profile_for_product_editor` | body: `params` | 新建 profile 响应体 |
| 更新 profile 名称 | `updateProfile` | `PUT` | `/profile/update_profile_name_for_product_editor/{profileId}?name={name}` | `profileId`, `name` | 更新后的 profile 响应体 |
| 删除 profile | `deleteProfile` | `DELETE` | `/profile/delete/{profileId}` | `profileId` | 删除结果响应体 |
| 创建产品属性 option | `createOption` | `POST` | `/product_attribute/option/create` | body: `params` | 新建 option 响应体 |
| 获取 profile script / options | `fetchProfileMsgByVersionId` | `GET` | `/profile/version_id/{versionId}` | `versionId` | profile 详情响应体 |
| 获取 project attribute tree + options | `fetchProjectAttributesWithOptionsByVersionId` | `GET` | `/product_attribute/option/project/tree` | query: `{ version_id }` | project attribute tree 响应体 |
| 获取 quote attribute tree + options | `fetchQuoteAttributesWithOptionsByVersionId` | `GET` | `/product_attribute/option/quote/tree` | query: `{ version_id }` | quote attribute tree 响应体 |
| 获取 item attribute tree + options | `fetchItemAttributesWithOptionsByVersionId` | `GET` | `/product_attribute/option/item/tree` | query: `{ version_id }` | item attribute tree 响应体 |
| 获取 unit attribute tree + options | `fetchUnitAttributesWithOptionsByVersionId` | `GET` | `/product_attribute/option/unit/tree` | query: `{ version_id }` | unit attribute tree 响应体 | 
| 校验 profile script | `baseCheckProfileScript` | `POST` | `/profile/script/base_check` | body: `{ script_msg }` | 校验结果响应体 |
| 保存 profile script | `saveProfileScript` | `PUT` | `/profile/{profileId}/update` | `profileId`, body: `{ script_msg }` | 保存结果响应体 |
| 按属性树名称和公司获取 version | `fetchProductAttributeVersionByAttributeNameCompanyId` | `GET` | `/product_attribute/version/all` | query: `{ attribute_name, company_id }` | attribute version 列表响应体 |
| 获取 project 属性树 + options |  | `GET` | `/product_attribute/project/all?version_id=${version_id}` | query: `{ version_id }` | project 属性树响应体 |
| 获取 quote 属性树 + options |  | `GET` | `/product_attribute/quote/all?version_id=${version_id}` | query: `{ version_id }` | quote 属性树响应体 |
| 获取 item 属性树 + options |  | `GET` | `/product_attribute/item/all?version_id=${version_id}` | query: `{ version_id }` | item 属性树响应体 |
| 获取 unit 属性树 | `fetchUnitAttributesByVersionId` | `GET` | `/product_attribute/unit/all` | query: `{ version_id }` | unit 属性树响应体 |
| 获取公司 option library | `fetchAllOptionLibraryByCompany` | `GET` | `/product_attribute/option/option_library/{companyId}` | `companyId` | option library 列表响应体 |
| 创建 option library | `createOptionLibraryByCompany` | `POST` | `/product_attribute/option/option_library/create/{productAttributeId}` | `productAttributeId` | 创建结果响应体 |
| 删除 option library | `deleteOptionLibraryByCompany` | `DELETE` | `/product_attribute/option/option_library/delete/{productAttributeId}` | `productAttributeId` | 删除结果响应体 |
| 获取某属性下 options | `fetchOptionsByProductAttrId` | `GET` | `/product_attribute/option/product_attribute_id/{productAttributeId}` | `productAttributeId` | option 列表响应体 |
| 上传 option 文件 | `updateFileForProductAttrOption` | `POST` | `/product_attribute/option/upload_file/{productAttributeId}` | `productAttributeId`, multipart `file` | 上传结果响应体 |
| 更新 option | `updateOptionByOptionId` | `PUT` | `/product_attribute/option/{productAttributeOptionId}/update` | `productAttributeOptionId`, body: `params` | 更新后的 option 响应体 |
| 删除 option | `deleteOptionByOptionId` | `DELETE` | `/product_attribute/option/{productAttributeOptionId}/delete` | `productAttributeOptionId` | 删除结果响应体 |
| 复制子 option | `copySubOption` | `POST` | `/product_attribute/option/option_library/copy_sub_option/{option_id}?name={name}` | `option_id`, `name` | 复制后的 option 响应体 |
| 跨 library 复制 option | `copyLibraryOption` | `POST` | `/product_attribute/option/option_library/copy?from_product_attribute_id={from}&to_product_attribute_id={to}` | `from_product_attribute_id`, `to_product_attribute_id` | 复制结果响应体 |
| [获取 box types](#api-get-box-types) | 
| [新增 box type](#api-create-box-type) | 
| [更新 box type](#api-update-box-type) |
| [删除 box type](#api-delete-box-type) | 
| 获取属性 value type 枚举 |  | `GET` | `/product_attribute/value_type/all` |  | value type 列表响应体 |
| 删除属性节点 |  | `DELETE` | `/product_attribute/{id}/delete` | `id` | 删除结果响应体 |
| 保存 attribute tree |  | `PUT` | `/product_attribute?version_id=${version_id}` | |  |
