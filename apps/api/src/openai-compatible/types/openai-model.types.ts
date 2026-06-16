export interface OpenAiModelObject {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

export interface OpenAiModelsListResponse {
  object: 'list';
  data: OpenAiModelObject[];
}
