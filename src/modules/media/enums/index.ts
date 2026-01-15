export enum MediaType {
  UPLOAD = 'upload',
  PROFILE_PICTURE = 'profile_picture',
  AI_AVATAR = 'ai_avatar',
  AI_VOICE = 'ai_voice',
  CHAT_IMAGE = 'chat_image',
  CHAT_VIDEO = 'chat_video',
}

export enum AIMediaOwner {
  USER = 'user',
  SYSTEM = 'system',
}

export enum AIAccent {
  US = 'english (us)',
  UK = 'english (uk)',
  AU = 'english (au)',
  IN = 'english (in)',
  CA = 'english (ca)',
  ZA = 'english (za)',
  IE = 'english (ie)',
  NZ = 'english (nz)',
  SCOTLAND = 'english (scotland)',
  WALES = 'english (wales)',
  NIGERIA = 'english (nigeria)',
  OTHER = 'other',
}

export const MAX_FILE_SIZE = 1024 * 1024 * 5;
