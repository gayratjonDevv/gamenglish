export const appConfig = Object.freeze({
  contentBase: import.meta.env.VITE_CONTENT_BASE_URL ?? '/content/v1/',
  assetBase: import.meta.env.VITE_ASSET_BASE_URL ?? '/assets/',
  decoderBase: import.meta.env.VITE_DECODER_BASE_URL || undefined,
});
