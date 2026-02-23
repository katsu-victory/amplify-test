import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Subject: a.model({
    subjectId: a.string().required(),
    name: a.string(),
    targetIntensity: a.float(),
    currentVo2max: a.float(),
    menuType: a.string(),
    durationMinutes: a.integer(),
    lastStatus: a.string(),
  }).authorization(allow => [
    allow.authenticated(), // ログインしていれば誰でも全操作可能（開発用）
  ]),

  ActivityLog: a.model({
    subjectId: a.string().required(),
    type: a.string(),
    duration: a.integer(),
    intensity: a.float(),
    timestamp: a.datetime(),
  }).authorization(allow => [
    allow.authenticated(), // ログインしていれば誰でも全操作可能（開発用）
  ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    // API Keyではなく、ログイン情報を優先するように変更
    defaultAuthorizationMode: 'userPool',
  },
});