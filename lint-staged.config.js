const { ESLint } = require("eslint");

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const ignoredFiles = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file))
  );
  const filteredFiles = files.filter((_, i) => !ignoredFiles[i]);
  return filteredFiles.join(" ");
};

module.exports = {
  "*.{tsx,ts,js}": async (files) => {
    const filesToLint = await removeIgnoredFiles(files);
    if (!filesToLint) return [];

    return [
      `prettier --write ${filesToLint}`,
      `eslint --max-warnings 1 ${filesToLint} --fix`,
    ];
  },
  "*.{yml,yaml,json,md,graphql}": ["prettier --write"],
};
