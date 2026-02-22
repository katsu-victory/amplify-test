import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 1. 研究プロジェクト
  Project: a.model({
    name: a.string().required(),
    description: a.string(),
    subjects: a.hasMany('Subject', 'projectId'), // プロジェクトは複数の被験者を持つ
  }).authorization(allow => [allow.publicApiKey()]),

  // 2. 被験者（Subject）
  Subject: a.model({
    subjectId: a.string().required(), // S001 など
    name: a.string(),
    projectId: a.id(),
    project: a.belongsTo('Project', 'projectId'),
    // 運動強度設定（調整用パラメータ）
    targetIntensity: a.float(),       // 45% など
    currentVo2max: a.float(),
    lastStatus: a.string(),           // Active, Rest など
  }).authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });