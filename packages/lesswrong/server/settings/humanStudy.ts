import { localSiteUrl } from './localSiteUrl';

const hostedSiteUrl = process.env.HUMANSTUDY_SITE_URL;
if (process.env.VERCEL && !hostedSiteUrl) throw new Error('HUMANSTUDY_SITE_URL is required for hosted forums.');
if (hostedSiteUrl && !process.env.HUMANSTUDY_DATABASE_ID) throw new Error('HUMANSTUDY_DATABASE_ID is required for hosted forums.');
if (hostedSiteUrl && !process.env.PG_SSL_CA) throw new Error('PG_SSL_CA is required for hosted forums.');

// One unsigned Cloudinary upload preset (in our own account, see
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) serves every image upload type.
const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || null;

export const humanStudySettings = {
  forumType: 'LessWrong',
  humanStudyForum: true,
  humanStudyHubAuth: process.env.HUMANSTUDY_HUB_AUTH === 'true',
  humanStudyHubAuthOrigin: process.env.HUB_AUTH_ORIGIN ?? 'https://humanstudy-hub.com',
  humanStudy: { featuredPostId: null },
  title: 'HumanStudy Forum',
  tagline: 'Understanding people and society, together.',
  siteNameWithArticle: 'HumanStudy Forum',
  siteUrl: hostedSiteUrl ?? localSiteUrl,
  faviconUrl: '/humanstudy/favicon.svg',
  faviconWithBadge: '/humanstudy/favicon.svg',
  logoUrl: '/humanstudy/favicon.svg',
  forumSettings: { headerTitle: 'HumanStudy', shortForumTitle: 'HumanStudy', tabTitle: 'HumanStudy Forum' },
  testServer: !hostedSiteUrl,
  debug: false,
  sentry: { url: null, environment: 'humanstudy-local', release: 'local' },
  integrations: { googleTagManagerId: '', reCaptchaSiteKey: '' },
  disallowCrawlers: true,
  disableEnsureIndex: true,
  disableElastic: true,
  intercomAppId: '',
  hasEvents: false,
  hasCuratedPosts: true,
  hasRejectedContentSection: false,
  ultraFeedEnabled: false,
  expectedDatabaseId: process.env.HUMANSTUDY_DATABASE_ID ?? 'humanstudy-local',
  analytics: { environment: hostedSiteUrl ? 'humanstudy-forum' : 'humanstudy-local' },
  cloudinary: {
    uploadPresetEditor: cloudinaryUploadPreset,
    uploadPresetSocialPreview: cloudinaryUploadPreset,
    uploadPresetProfile: cloudinaryUploadPreset,
    uploadPresetGridImage: cloudinaryUploadPreset,
    uploadPresetBanner: cloudinaryUploadPreset,
    uploadPresetEventImage: cloudinaryUploadPreset,
    uploadPresetSpotlight: cloudinaryUploadPreset,
    uploadPresetDigest: cloudinaryUploadPreset,
  },
  homepagePostFeeds: [{ name: 'latest', label: 'Latest', description: 'Recent discussions' }],
};
