export async function getTemplateContent(
  bucket: R2Bucket,
  fileKey: string
): Promise<string | null> {
  const object = await bucket.get(fileKey);
  if (!object) return null;
  return object.text();
}
