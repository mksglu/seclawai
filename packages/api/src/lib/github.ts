const REPO_OWNER = "mksglu";
const REPO_NAME = "seclawai-paid";
const BRANCH = "main";

type GitHubFile = {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
};

export async function getTemplateFromGitHub(
  token: string,
  templateId: string
): Promise<Record<string, string> | null> {
  const dirUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${templateId}?ref=${BRANCH}`;

  const dirRes = await fetch(dirUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "seclaw-api",
    },
  });

  if (!dirRes.ok) return null;

  const files = (await dirRes.json()) as GitHubFile[];
  const bundle: Record<string, string> = {};

  await Promise.all(
    files
      .filter((f) => f.type === "file" && f.download_url)
      .map(async (f) => {
        const res = await fetch(f.download_url!, {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "seclaw-api",
          },
        });
        if (res.ok) {
          bundle[f.name] = await res.text();
        }
      })
  );

  return Object.keys(bundle).length > 0 ? bundle : null;
}
