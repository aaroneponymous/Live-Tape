export type CrowdVoltCaptureClassification =
  | "ACCESS_BLOCKED"
  | "NOT_CONFIRMED_EVENT_PAGE";

export type CrowdVoltCaptureClassificationResult = {
  readonly classification: CrowdVoltCaptureClassification;
  readonly matchedSignals: readonly string[];
};

const ATTENTION_REQUIRED_TITLE = "Attention Required! | Cloudflare";
const BLOCKED_COPY = "Sorry, you have been blocked";
const RAY_ID_LABEL = "Cloudflare Ray ID:";
const ROBOTS_NOINDEX_NOFOLLOW =
  '<meta name="robots" content="noindex, nofollow">';

function hasExactAttribute(html: string, attribute: string): boolean {
  return html.includes(attribute);
}

function titleTextMatchesAttentionRequired(html: string): boolean {
  const open = html.indexOf("<title>");
  if (open === -1) {
    return false;
  }
  const contentStart = open + "<title>".length;
  const close = html.indexOf("</title>", contentStart);
  if (close === -1) {
    return false;
  }
  return html.slice(contentStart, close).trim() === ATTENTION_REQUIRED_TITLE;
}

export function classifyCrowdVoltCapturedHtml(
  html: string,
): CrowdVoltCaptureClassificationResult {
  const hasCfWrapper = hasExactAttribute(html, 'id="cf-wrapper"');
  const hasCfErrorDetails = hasExactAttribute(html, 'id="cf-error-details"');
  const hasCfStylesId = hasExactAttribute(html, 'id="cf_styles-css"');
  const hasCfErrorsCssPath = html.includes("/cdn-cgi/styles/cf.errors.css");
  const hasCfErrorStylesheet = hasCfStylesId || hasCfErrorsCssPath;
  const hasBlockHeadline = hasExactAttribute(
    html,
    'data-translate="block_headline"',
  );
  const hasAttentionRequiredTitle = titleTextMatchesAttentionRequired(html);
  const hasBlockedCopy = html.includes(BLOCKED_COPY);
  const hasUnableToAccess = hasExactAttribute(
    html,
    'data-translate="unable_to_access"',
  );
  const hasChallengeScript = html.includes("/cdn-cgi/challenge-platform/");
  const hasRayIdLabel = html.includes(RAY_ID_LABEL);
  const hasRobotsNoindexNofollow = html.includes(ROBOTS_NOINDEX_NOFOLLOW);
  const hasCaptchaContainer = html.includes("captcha-container");

  const matchedSignals: string[] = [];
  if (hasCfWrapper) {
    matchedSignals.push("cf_wrapper");
  }
  if (hasCfErrorDetails) {
    matchedSignals.push("cf_error_details");
  }
  if (hasCfErrorStylesheet) {
    matchedSignals.push("cf_error_stylesheet");
  }
  if (hasBlockHeadline) {
    matchedSignals.push("cf_block_headline");
  }
  if (hasAttentionRequiredTitle) {
    matchedSignals.push("cf_attention_required_title");
  }
  if (hasBlockedCopy) {
    matchedSignals.push("cf_blocked_copy");
  }
  if (hasUnableToAccess) {
    matchedSignals.push("cf_unable_to_access");
  }
  if (hasChallengeScript) {
    matchedSignals.push("cf_challenge_script");
  }
  if (hasRayIdLabel) {
    matchedSignals.push("cf_ray_id_label");
  }
  if (hasRobotsNoindexNofollow) {
    matchedSignals.push("cf_robots_noindex_nofollow");
  }
  if (hasCaptchaContainer) {
    matchedSignals.push("cf_captcha_container");
  }

  const group1 =
    hasCfWrapper && hasCfErrorDetails && hasCfErrorStylesheet;
  const group2 = hasBlockHeadline || hasAttentionRequiredTitle;
  const group3 = hasBlockedCopy || hasUnableToAccess;

  const classification: CrowdVoltCaptureClassification =
    group1 && group2 && group3
      ? "ACCESS_BLOCKED"
      : "NOT_CONFIRMED_EVENT_PAGE";

  return Object.freeze({
    classification,
    matchedSignals: Object.freeze(matchedSignals),
  });
}
